import type { PassportSpec } from './passportSpecs.ts'
import type { Transform, FrameRect } from './cropImage.ts'

// ─── Constants ──────────────────────────────────────────────────────────────

const PRINT_DPI = 300
const MM_PER_IN = 25.4

/** 4×6 inch sheet dimensions in mm */
const SHORT_MM = 4 * MM_PER_IN // 101.6 mm
const LONG_MM  = 6 * MM_PER_IN // 152.4 mm

/** Gap between passport photos in mm */
const GAP_MM = 2

// ─── Helpers ────────────────────────────────────────────────────────────────

function mmToPx(mm: number): number {
  return Math.round((mm * PRINT_DPI) / MM_PER_IN)
}

function fitCount(sheetW: number, sheetH: number, tileW: number, tileH: number) {
  const cols = Math.max(1, Math.floor((sheetW + GAP_MM) / (tileW + GAP_MM)))
  const rows = Math.max(1, Math.floor((sheetH + GAP_MM) / (tileH + GAP_MM)))
  return { cols, rows, count: cols * rows }
}

// ─── Layout calculation ──────────────────────────────────────────────────────

export interface PrintLayout {
  cols: number
  rows: number
  count: number
  /** Sheet width in mm (landscape: 152.4, portrait: 101.6) */
  sheetW_mm: number
  /** Sheet height in mm */
  sheetH_mm: number
  landscape: boolean
}

/**
 * Returns the optimal tile layout for a 4×6 inch sheet at 300 DPI with 2 mm gaps.
 * Tries both portrait (4×6) and landscape (6×4) and picks whichever fits more photos.
 * On a tie, portrait is preferred.
 */
export function calcPrintLayout(spec: PassportSpec): PrintLayout {
  const { photoWidthMm: tw, photoHeightMm: th } = spec

  const portrait  = fitCount(SHORT_MM, LONG_MM, tw, th)
  const landscape = fitCount(LONG_MM, SHORT_MM, tw, th)

  if (landscape.count > portrait.count) {
    return { ...landscape, sheetW_mm: LONG_MM, sheetH_mm: SHORT_MM, landscape: true }
  }
  return { ...portrait, sheetW_mm: SHORT_MM, sheetH_mm: LONG_MM, landscape: false }
}

// ─── Export ──────────────────────────────────────────────────────────────────

/**
 * Tiles the cropped passport photo onto a 4×6 inch sheet (portrait or landscape,
 * whichever fits more photos) at 300 DPI and triggers a JPEG download suitable
 * for printing at Officeworks, KMart, etc.
 *
 * Photos are centred on the sheet with 2 mm gaps and light grey dashed cut guides.
 */
export async function printLayoutAndDownload(
  imgEl: HTMLImageElement | HTMLCanvasElement,
  transform: Transform,
  frame: FrameRect,
  spec: PassportSpec,
  bgColor = '#ffffff',
): Promise<void> {
  // ── Source crop (same coordinate mapping as cropAndDownload) ──────────────
  const srcX = (frame.x - transform.x) / transform.scale
  const srcY = (frame.y - transform.y) / transform.scale
  const srcW = frame.w / transform.scale
  const srcH = frame.h / transform.scale

  // ── Best-fit layout ───────────────────────────────────────────────────────
  const { cols, rows, sheetW_mm, sheetH_mm } = calcPrintLayout(spec)

  const tileW_mm = spec.photoWidthMm
  const tileH_mm = spec.photoHeightMm
  const gridW_mm = cols * tileW_mm + (cols - 1) * GAP_MM
  const gridH_mm = rows * tileH_mm + (rows - 1) * GAP_MM

  // Centre the grid on the sheet
  const originX_mm = (sheetW_mm - gridW_mm) / 2
  const originY_mm = (sheetH_mm - gridH_mm) / 2

  // ── Convert to pixels ─────────────────────────────────────────────────────
  const sheetW = mmToPx(sheetW_mm)
  const sheetH = mmToPx(sheetH_mm)
  const tileW  = mmToPx(tileW_mm)
  const tileH  = mmToPx(tileH_mm)
  const gapPx  = mmToPx(GAP_MM)
  const originX = mmToPx(originX_mm)
  const originY = mmToPx(originY_mm)

  // ── Draw ──────────────────────────────────────────────────────────────────
  const canvas = document.createElement('canvas')
  canvas.width  = sheetW
  canvas.height = sheetH

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  // White sheet background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, sheetW, sheetH)

  // Tile photos
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const dx = originX + col * (tileW + gapPx)
      const dy = originY + row * (tileH + gapPx)

      // Background colour for this tile (shows through transparent areas)
      ctx.fillStyle = bgColor
      ctx.fillRect(dx, dy, tileW, tileH)

      ctx.drawImage(imgEl, srcX, srcY, srcW, srcH, dx, dy, tileW, tileH)
    }
  }

  // ── Cut guides ────────────────────────────────────────────────────────────
  ctx.save()
  ctx.strokeStyle = 'rgba(160,160,160,0.7)'
  ctx.lineWidth = 1
  ctx.setLineDash([6, 5])

  const halfGap = Math.round(gapPx / 2)

  for (let col = 1; col < cols; col++) {
    const x = originX + col * (tileW + gapPx) - halfGap
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, sheetH)
    ctx.stroke()
  }

  for (let row = 1; row < rows; row++) {
    const y = originY + row * (tileH + gapPx) - halfGap
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(sheetW, y)
    ctx.stroke()
  }

  ctx.restore()

  // ── Download ──────────────────────────────────────────────────────────────
  const count = cols * rows
  const filename = `passport-print-4x6-${spec.id}-${count}up.jpg`

  await new Promise<void>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) { reject(new Error('toBlob failed')); return }
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
        resolve()
      },
      'image/jpeg',
      0.97,
    )
  })
}
