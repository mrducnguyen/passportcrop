import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  type PointerEvent,
  type WheelEvent,
} from 'react'
import { cx } from '@emotion/css'
import PassportOverlay from './PassportOverlay.tsx'
import type { PassportSpec } from '../utils/passportSpecs.ts'
import type { Transform } from '../utils/cropImage.ts'
import { cropAndDownload } from '../utils/cropImage.ts'
import { printLayoutAndDownload, calcPrintLayout } from '../utils/printLayout.ts'
import { detectFace, faceToTransform } from '../utils/faceDetect.ts'
import { removeBackground } from '../utils/bgRemoval.ts'
import BgColorPicker from './BgColorPicker.tsx'
import { tokens } from '../styles/tokens.ts'
import { s } from './PhotoCropper.styles.ts'

// ─── Constants ─────────────────────────────────────────────────────────────

const MIN_SCALE = 0.1
const MAX_SCALE = 20
// Eraser opacity per stroke — each pass removes ~40% of remaining alpha.
// ~4–5 overlapping passes needed to cross the snap threshold.
const ERASE_STRENGTH = 0.4
// Pixels with alpha below this (out of 255) snap to fully transparent after each stroke.
const ERASE_SNAP_THRESHOLD = 10
const UNDO_MAX_STEPS = 20

// ─── Component ─────────────────────────────────────────────────────────────

interface Props {
  imgSrc: string
  spec: PassportSpec
  onReset: () => void
}

export default function PhotoCropper({ imgSrc, spec, onReset }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const eraserCanvasRef = useRef<HTMLCanvasElement>(null)

  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 })
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 })
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 })
  const [downloading, setDownloading] = useState(false)
  const [printingLayout, setPrintingLayout] = useState(false)
  const [detectStatus, setDetectStatus] = useState<'idle' | 'detecting' | 'found' | 'notfound'>(
    'idle',
  )
  const [bgStatus, setBgStatus] = useState<'idle' | 'processing' | 'done'>('idle')
  const [processedSrc, setProcessedSrc] = useState<string | null>(null)
  const [bgColor, setBgColor] = useState('#ffffff')

  // ── Eraser state ──────────────────────────────────────────────────────────
  const [eraserActive, setEraserActive] = useState(false)
  const [eraserSize, setEraserSize] = useState(20) // screen-px radius
  const [eraserReady, setEraserReady] = useState(false) // canvas has image data
  const [canUndo, setCanUndo] = useState(false)

  const dragActive = useRef(false)
  const lastPointer = useRef({ x: 0, y: 0 })
  const isErasing = useRef(false)
  const initialLoadDone = useRef(false)
  const undoStack = useRef<HTMLCanvasElement[]>([])
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const lastPinchDist = useRef(0)
  const erasedBounds = useRef<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
  // Cached container rect — invalidated on resize so getBoundingClientRect is called at most once per stroke
  const containerRectRef = useRef<DOMRect | null>(null)
  // Ref to the eraser cursor <g> — updated imperatively to avoid React re-renders on every pointer move
  const cursorGroupRef = useRef<SVGGElement>(null)

  // Sync mutable values into refs so stable callbacks always read the latest state.
  const transformRef = useRef(transform)
  transformRef.current = transform
  const eraserSizeRef = useRef(eraserSize)
  eraserSizeRef.current = eraserSize
  const eraserActiveRef = useRef(eraserActive)
  eraserActiveRef.current = eraserActive

  // ── GPU availability (for BG-removal warning) ───────────────────────────
  const gpuAvailable = useMemo(() => {
    try {
      const c = document.createElement('canvas')
      return !!(c.getContext('webgl2') ?? c.getContext('webgl'))
    } catch {
      return false
    }
  }, [])

  // ── Reset guards on new photo ───────────────────────────────────────────
  useEffect(() => {
    initialLoadDone.current = false
    setEraserActive(false)
    setEraserReady(false)
    undoStack.current.forEach((c) => { c.width = 0 })
    undoStack.current = []
    setCanUndo(false)
  }, [imgSrc])

  // ── Reset eraser canvas when processed image changes ───────────────────
  useEffect(() => {
    setEraserReady(false)
    undoStack.current.forEach((c) => { c.width = 0 })
    undoStack.current = []
    setCanUndo(false)
    if (!processedSrc) setEraserActive(false)
  }, [processedSrc])

  // ── Load processed image into eraser canvas when eraser is activated ────
  useEffect(() => {
    if (!eraserActive || eraserReady) return
    const canvas = eraserCanvasRef.current
    if (!canvas) return
    const src = processedSrc ?? imgSrc
    const img = new Image()
    img.onload = () => {
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, 0, 0)
      setEraserReady(true)
    }
    img.src = src
  }, [eraserActive, eraserReady, processedSrc, imgSrc])

  // ── Passport frame rect ─────────────────────────────────────────────────
  const frame = useMemo(() => {
    const { w: cw, h: ch } = containerSize
    const ratio = spec.photoWidthMm / spec.photoHeightMm
    const maxH = ch * 0.78
    const maxW = cw * 0.6

    let fh = maxH
    let fw = fh * ratio
    if (fw > maxW) {
      fw = maxW
      fh = fw / ratio
    }

    return { x: (cw - fw) / 2, y: (ch - fh) / 2, w: fw, h: fh }
  }, [containerSize, spec])

  // ── Actual download dimensions (native source pixels, min = spec 300 DPI) ─
  const downloadSize = useMemo(() => {
    const rawW = Math.round(frame.w / transform.scale)
    const rawH = Math.round(frame.h / transform.scale)
    const outW = rawW >= spec.outputWidth ? rawW : spec.outputWidth
    const outH = rawW >= spec.outputWidth ? rawH : spec.outputHeight
    return { w: outW, h: outH }
  }, [frame, transform, spec])

  // ── Observe container resize ────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      containerRectRef.current = null // invalidate — container moved or resized
      setContainerSize({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── Fit image to cover the passport frame (used by Reset button and first load) ─
  const fitImage = useCallback(() => {
    if (!naturalSize.w || !frame.w) return
    const scale = Math.max(frame.w / naturalSize.w, frame.h / naturalSize.h)
    const x = frame.x + (frame.w - naturalSize.w * scale) / 2
    const y = frame.y + (frame.h - naturalSize.h * scale) / 2
    setTransform({ x, y, scale })
  }, [naturalSize, frame])

  const onImageLoad = useCallback(() => {
    const img = imgRef.current
    if (!img) return
    if (initialLoadDone.current) return
    initialLoadDone.current = true

    const nat = { w: img.naturalWidth, h: img.naturalHeight }
    setNaturalSize(nat)

    // Fit inline so subsequent container changes (e.g. BgColorPicker appearing) don't reset zoom
    const scale = Math.max(frame.w / nat.w, frame.h / nat.h)
    const x = frame.x + (frame.w - nat.w * scale) / 2
    const y = frame.y + (frame.h - nat.h * scale) / 2
    setTransform({ x, y, scale })

    if (__FACE_DETECTION__ && gpuAvailable) {
      setDetectStatus('detecting')
      detectFace(img)
        .then((face) => {
          if (!face) {
            setDetectStatus('notfound')
            return
          }
          setTransform(faceToTransform(face, frame, spec))
          setDetectStatus('found')
        })
        .catch(() => setDetectStatus('notfound'))
    }
  }, [frame, spec, gpuAvailable])

  // ── Erase at a screen coordinate ───────────────────────────────────────
  // Reads transform/eraserSize from refs — no deps needed, always stable.
  const eraseAt = useCallback((clientX: number, clientY: number) => {
    const canvas = eraserCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const el = containerRef.current
    if (!el) return

    const rect = containerRectRef.current ?? el.getBoundingClientRect()
    const t = transformRef.current
    const screenR = eraserSizeRef.current

    // Convert screen → canvas (natural image) coordinates
    const imgX = (clientX - rect.left - t.x) / t.scale
    const imgY = (clientY - rect.top - t.y) / t.scale
    const imgR = screenR / t.scale

    // Soft radial gradient — partial opacity so multiple passes are needed to fully erase.
    // Pixels only disappear after crossing ERASE_SNAP_THRESHOLD (snapped at download time).
    const grad = ctx.createRadialGradient(imgX, imgY, 0, imgX, imgY, imgR)
    grad.addColorStop(0, `rgba(0,0,0,${ERASE_STRENGTH})`)
    grad.addColorStop(0.6, `rgba(0,0,0,${ERASE_STRENGTH * 0.5})`)
    grad.addColorStop(1, 'rgba(0,0,0,0)')

    ctx.save()
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(imgX, imgY, imgR, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // Expand the dirty region so snapLowAlpha knows what area to scan
    const b = erasedBounds.current
    if (!b) {
      erasedBounds.current = { x1: imgX - imgR, y1: imgY - imgR, x2: imgX + imgR, y2: imgY + imgR }
    } else {
      b.x1 = Math.min(b.x1, imgX - imgR)
      b.y1 = Math.min(b.y1, imgY - imgR)
      b.x2 = Math.max(b.x2, imgX + imgR)
      b.y2 = Math.max(b.y2, imgY + imgR)
    }
  }, [])

  // ── Undo last erase stroke ──────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    const buf = undoStack.current.pop()
    if (!buf) return
    const canvas = eraserCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(buf, 0, 0)
    buf.width = 0 // release GPU memory
    setCanUndo(undoStack.current.length > 0)
  }, [])

  // ── Snap near-transparent pixels to fully transparent after each stroke ───
  // Only scans the bounding box of the brushed area — cheap even on large images.
  const snapLowAlpha = useCallback(() => {
    const canvas = eraserCanvasRef.current
    const bounds = erasedBounds.current
    if (!canvas || !bounds) return
    erasedBounds.current = null

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const x = Math.max(0, Math.floor(bounds.x1))
    const y = Math.max(0, Math.floor(bounds.y1))
    const w = Math.min(canvas.width - x, Math.ceil(bounds.x2 - bounds.x1) + 2)
    const h = Math.min(canvas.height - y, Math.ceil(bounds.y2 - bounds.y1) + 2)
    if (w <= 0 || h <= 0) return

    const imageData = ctx.getImageData(x, y, w, h)
    const { data } = imageData
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0 && data[i] < ERASE_SNAP_THRESHOLD) data[i] = 0
    }
    ctx.putImageData(imageData, x, y)
  }, [])

  // Keyboard shortcuts while eraser is active
  useEffect(() => {
    if (!eraserActive) return
    function onKeyDown(e: KeyboardEvent) {
      // Ctrl/Cmd+Z — undo (only when canvas is loaded)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (eraserReady) handleUndo()
        return
      }
      // [ / ] — decrease / increase eraser size by 5 px
      if (e.key === '[') {
        e.preventDefault()
        setEraserSize((s) => Math.max(10, s - 5))
      } else if (e.key === ']') {
        e.preventDefault()
        setEraserSize((s) => Math.min(120, s + 5))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [eraserActive, eraserReady, handleUndo])

  // ── Pointer drag / pinch-to-zoom / erase ───────────────────────────────
  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

      if (activePointers.current.size >= 2) {
        // Second finger landed — cancel any ongoing pan/erase and start pinch
        dragActive.current = false
        isErasing.current = false
        const [p0, p1] = [...activePointers.current.values()]
        if (p0 && p1) lastPinchDist.current = Math.hypot(p1.x - p0.x, p1.y - p0.y)
        return
      }

      // Single pointer
      if (eraserActive && eraserReady) {
        const canvas = eraserCanvasRef.current
        if (canvas) {
          // Canvas-to-canvas drawImage is a pure GPU copy — no CPU readback, no async Promise stall
          const buf = document.createElement('canvas')
          buf.width = canvas.width
          buf.height = canvas.height
          buf.getContext('2d')?.drawImage(canvas, 0, 0)
          const evicted = undoStack.current.length >= UNDO_MAX_STEPS ? undoStack.current.shift() : null
          if (evicted) evicted.width = 0 // release GPU memory
          undoStack.current.push(buf)
          setCanUndo(true)
        }
        isErasing.current = true
        eraseAt(e.clientX, e.clientY)
      } else {
        dragActive.current = true
        lastPointer.current = { x: e.clientX, y: e.clientY }
      }
    },
    [eraserActive, eraserReady, eraseAt],
  )

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

      if (activePointers.current.size >= 2) {
        // Pinch-to-zoom — zoom toward the midpoint between the two fingers
        const [p0, p1] = [...activePointers.current.values()]
        if (!p0 || !p1) return
        const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y)
        if (lastPinchDist.current > 0) {
          const factor = dist / lastPinchDist.current
          const el = containerRef.current
          if (el) {
            const rect = el.getBoundingClientRect()
            const cx = (p0.x + p1.x) / 2 - rect.left
            const cy = (p0.y + p1.y) / 2 - rect.top
            setTransform((t) => {
              const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, t.scale * factor))
              const ratio = newScale / t.scale
              return { scale: newScale, x: cx - ratio * (cx - t.x), y: cy - ratio * (cy - t.y) }
            })
          }
        }
        lastPinchDist.current = dist
        return
      }

      // Single pointer
      if (eraserActiveRef.current) {
        const el = containerRef.current
        if (el) {
          containerRectRef.current ??= el.getBoundingClientRect()
          const { left, top } = containerRectRef.current
          cursorGroupRef.current?.setAttribute(
            'transform',
            `translate(${e.clientX - left},${e.clientY - top})`,
          )
          cursorGroupRef.current?.style.setProperty('visibility', 'visible')
        }
        if (isErasing.current) eraseAt(e.clientX, e.clientY)
        return
      }
      if (!dragActive.current) return
      const dx = e.clientX - lastPointer.current.x
      const dy = e.clientY - lastPointer.current.y
      lastPointer.current = { x: e.clientX, y: e.clientY }
      setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }))
    },
    [eraseAt],
  )

  const onPointerUp = useCallback((e: PointerEvent<HTMLDivElement>) => {
    activePointers.current.delete(e.pointerId)
    isErasing.current = false

    if (activePointers.current.size < 2) lastPinchDist.current = 0

    if (activePointers.current.size === 1 && !eraserActiveRef.current) {
      // One finger remains after pinch — resume pan from that finger's position
      const [remaining] = [...activePointers.current.values()]
      if (remaining) lastPointer.current = remaining
      dragActive.current = true
    } else {
      dragActive.current = false
    }
  }, [])

  // ── Wheel zoom toward cursor ────────────────────────────────────────────
  const onWheel = useCallback(
    (e: WheelEvent<HTMLDivElement>) => {
      if (detectStatus === 'detecting' || bgStatus === 'processing') return
      e.preventDefault()
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      // Alt+scroll → fine zoom (~1% per tick); plain scroll → coarse (~10%)
      const step = e.altKey ? 1.01 : 1.1
      const delta = e.deltaY < 0 ? step : 1 / step

      setTransform((t) => {
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, t.scale * delta))
        const ratio = newScale / t.scale
        return {
          scale: newScale,
          x: cx - ratio * (cx - t.x),
          y: cy - ratio * (cy - t.y),
        }
      })
    },
    [detectStatus, bgStatus],
  )

  const handleDownload = useCallback(async () => {
    const source = eraserReady && eraserCanvasRef.current ? eraserCanvasRef.current : imgRef.current
    if (!source) return
    setDownloading(true)
    try {
      // Snap near-transparent pixels once, just before download — keeps it off the interactive path
      if (eraserReady) snapLowAlpha()
      await cropAndDownload(source, transform, frame, spec, bgColor)
    } finally {
      setDownloading(false)
    }
  }, [eraserReady, snapLowAlpha, transform, frame, spec, bgColor])

  const handlePrintLayout = useCallback(async () => {
    const source = eraserReady && eraserCanvasRef.current ? eraserCanvasRef.current : imgRef.current
    if (!source) return
    setPrintingLayout(true)
    try {
      if (eraserReady) snapLowAlpha()
      await printLayoutAndDownload(source, transform, frame, spec, bgColor)
    } finally {
      setPrintingLayout(false)
    }
  }, [eraserReady, snapLowAlpha, transform, frame, spec, bgColor])

  const printCount = useMemo(() => calcPrintLayout(spec).count, [spec])

  // ── Auto-dismiss face detection badge ──────────────────────────────────
  useEffect(() => {
    if (detectStatus !== 'found') return
    const id = setTimeout(() => setDetectStatus('idle'), 2500)
    return () => clearTimeout(id)
  }, [detectStatus])

  const zoom = useCallback((factor: number) => {
    setTransform((t) => ({
      ...t,
      scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, t.scale * factor)),
    }))
  }, [])

  // ── Shared transform style ──────────────────────────────────────────────
  const transformStyle = {
    position: 'absolute' as const,
    transformOrigin: '0 0',
    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
    pointerEvents: 'none' as const,
    userSelect: 'none' as const,
  }

  return (
    <div className={s.root}>
      <div className={s.toolbar}>
        <div className={s.toolbarLeft}>
          <button className={s.btnGhost} onClick={onReset}>
            ← New photo
          </button>
          <button className={s.btnGhost} onClick={fitImage} title="Reset zoom">
            ⟳ Reset
          </button>
          <button className={s.btnGhost} onClick={() => zoom(1.2)}>
            + Zoom in
          </button>
          <button className={s.btnGhost} onClick={() => zoom(1 / 1.2)}>
            − Zoom out
          </button>
          {__FACE_DETECTION__ && (
            <button
              className={s.btnDetect}
              disabled={detectStatus === 'detecting'}
              onClick={() => {
                const img = imgRef.current
                if (!img) return
                setDetectStatus('detecting')
                detectFace(img)
                  .then((face) => {
                    if (!face) {
                      setDetectStatus('notfound')
                      return
                    }
                    setTransform(faceToTransform(face, frame, spec))
                    setDetectStatus('found')
                  })
                  .catch(() => setDetectStatus('notfound'))
              }}
            >
              ◎ Re-detect face
            </button>
          )}
          {__BG_REMOVAL__ && bgStatus !== 'done' && (
            <>
              <button
                className={s.btnDetect}
                disabled={bgStatus === 'processing' || detectStatus === 'detecting'}
                title="Remove background — unlocks the eraser tool for touch-up"
                onClick={() => {
                  const img = imgRef.current
                  if (!img) return
                  setBgStatus('processing')
                  removeBackground(img)
                    .then((url) => {
                      if (url) setProcessedSrc(url)
                      setBgStatus('done')
                    })
                    .catch(() => setBgStatus('idle'))
                }}
              >
                ✦ Remove BG
              </button>
              {!gpuAvailable && (
                <span
                  style={{ fontSize: 11, color: tokens.yellow, whiteSpace: 'nowrap' }}
                  title="No GPU detected — background removal runs on CPU and may take several minutes"
                >
                  ⚠ No GPU
                </span>
              )}
            </>
          )}
          {__BG_REMOVAL__ && bgStatus === 'done' && (
            <>
              <button
                className={s.btnGhost}
                onClick={() => {
                  if (processedSrc) URL.revokeObjectURL(processedSrc)
                  setProcessedSrc(null)
                  setBgStatus('idle')
                }}
              >
                ✕ Reset BG
              </button>
              <button
                className={cx(s.btnDetect, eraserActive && s.btnDetectOn)}
                onClick={() => setEraserActive((v) => !v)}
                title="Erase residual background pixels"
              >
                ◈ Eraser
              </button>
              {canUndo && (
                <button
                  className={s.btnGhost}
                  onClick={handleUndo}
                  title="Undo last stroke — Ctrl+Z"
                >
                  ↩ Undo
                </button>
              )}
              {eraserActive && (
                <div className={s.eraserSizeBar}>
                  <span className={s.eraserSizeLabel}>Size</span>
                  <input
                    type="range"
                    min={10}
                    max={120}
                    value={eraserSize}
                    className={s.eraserSizeSlider}
                    title="Eraser size — smaller / larger (shortcuts: [ / ])"
                    onChange={(e) => setEraserSize(Number(e.target.value))}
                  />
                  <span className={s.eraserSizeLabel} title="smaller / larger (shortcuts: [ / ])">
                    {eraserSize * 2}px
                  </span>
                </div>
              )}
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className={s.btnPrimary} onClick={handleDownload} disabled={downloading || printingLayout}>
            {downloading ? 'Saving…' : `↓ Download (${downloadSize.w}×${downloadSize.h}px)`}
          </button>
          <button
            className={s.btnPrimary}
            onClick={handlePrintLayout}
            disabled={downloading || printingLayout}
            title={`Tile ${printCount} photos on a 4×6 inch sheet — ready to print at Officeworks, KMart, etc.`}
          >
            {printingLayout ? 'Building…' : `⊞ Print 4×6 (${printCount} photos)`}
          </button>
        </div>
      </div>

      {bgStatus === 'done' && <BgColorPicker value={bgColor} onChange={setBgColor} />}

      <div
        ref={containerRef}
        className={cx(s.viewport, eraserActive ? s.viewportErase : s.viewportPan)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => cursorGroupRef.current?.style.setProperty('visibility', 'hidden')}
        onWheel={onWheel}
      >
        {/* Background colour — sits below the image so it shows through transparent areas */}
        <div
          style={{
            position: 'absolute',
            left: frame.x,
            top: frame.y,
            width: frame.w,
            height: frame.h,
            background: bgColor,
            pointerEvents: 'none',
          }}
        />

        {/* Source image — hidden when eraser canvas has taken over */}
        <img
          ref={imgRef}
          src={processedSrc ?? imgSrc}
          onLoad={onImageLoad}
          draggable={false}
          alt="Passport photo source"
          style={{ ...transformStyle, display: eraserReady ? 'none' : 'block' }}
        />

        {/* Eraser canvas — shown once loaded, replaces img display */}
        <canvas
          ref={eraserCanvasRef}
          style={{ ...transformStyle, display: eraserReady ? 'block' : 'none' }}
        />

        {containerSize.w > 0 && (
          <PassportOverlay
            containerW={containerSize.w}
            containerH={containerSize.h}
            frame={frame}
            spec={spec}
          />
        )}

        {/* Eraser circle cursor indicator — updated imperatively to avoid re-renders on every move */}
        {eraserActive && (
          <svg
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              mixBlendMode: 'difference',
            }}
            width={containerSize.w}
            height={containerSize.h}
          >
            {/* <g transform="translate(x,y)"> is set imperatively; all children are relative to cursor center */}
            <g ref={cursorGroupRef} style={{ visibility: 'hidden' }}>
              <circle
                r={eraserSize}
                fill="none"
                stroke="white"
                strokeWidth="1.5"
                strokeDasharray="5 3"
              />
              <line x1={-5} y1={0} x2={5} y2={0} stroke="white" strokeWidth="1" />
              <line x1={0} y1={-5} x2={0} y2={5} stroke="white" strokeWidth="1" />
            </g>
          </svg>
        )}

        {/* Processing / detection overlay */}
        {(__FACE_DETECTION__ && detectStatus === 'detecting') ||
        (__BG_REMOVAL__ && bgStatus === 'processing') ? (
          <div className={s.detectOverlay}>
            <div className={s.spinner} />
            <span className={s.detectOverlayLabel}>
              {bgStatus === 'processing' ? 'Removing background…' : 'Detecting face…'}
            </span>
          </div>
        ) : null}
        {__FACE_DETECTION__ && detectStatus === 'found' && (
          <div className={s.detectBadge}>
            <span className={s.detectSuccess}>✓</span>
            Face detected — adjust if needed
          </div>
        )}
        {__FACE_DETECTION__ && detectStatus === 'notfound' && (
          <div className={s.detectBadge}>
            <span className={s.detectFail}>⚠</span>
            No face found — position manually
          </div>
        )}
      </div>

      <div className={s.infoPanel}>
        <div className={s.infoSection}>
          <h3>
            {spec.flag} {spec.label} Requirements
          </h3>
          <ul>
            <li>
              Photo: {spec.photoWidthMm}×{spec.photoHeightMm} mm
            </li>
            <li>
              Face height: {spec.minFaceHeightMm}–{spec.maxFaceHeightMm} mm
            </li>
            {spec.notes.slice(0, 2).map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
        <div className={s.infoHint}>
          <span>Drag to pan · Scroll to zoom · Alt+scroll for fine zoom</span>
          <span>Align face within the oval guide</span>
        </div>
      </div>
    </div>
  )
}
