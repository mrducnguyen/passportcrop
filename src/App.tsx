import { useState, useCallback, useRef } from 'react'
import { cx } from '@emotion/css'
import PhotoCropper from './components/PhotoCropper.tsx'
import { PASSPORT_SPECS, type PassportSpec } from './utils/passportSpecs.ts'
import { useTheme } from './hooks/useTheme.ts'
import { s } from './App.styles.ts'

// ─── Component ─────────────────────────────────────────────────────────────

export default function App() {
  const { theme, toggle } = useTheme()
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [selectedSpec, setSelectedSpec] = useState<PassportSpec>(PASSPORT_SPECS[0] as PassportSpec)
  const [draggingOver, setDraggingOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    setImgSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return url
    })
  }, [])

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) loadFile(file)
    },
    [loadFile],
  )

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDraggingOver(false)
      const file = e.dataTransfer.files[0]
      if (file) loadFile(file)
    },
    [loadFile],
  )

  const onReset = useCallback(() => {
    setImgSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  if (imgSrc) {
    return (
      <div className={s.app}>
        <header className={s.header}>
          <h1 className={s.logo}>PassportCrop</h1>
          <div className={s.specSwitcher}>
            {PASSPORT_SPECS.map((spec) => (
              <button
                key={spec.id}
                className={cx(s.specBtn, selectedSpec.id === spec.id && s.specBtnActive)}
                onClick={() => setSelectedSpec(spec)}
              >
                {spec.flag} {spec.label}
              </button>
            ))}
          </div>
          <button
            className={s.themeBtn}
            onClick={toggle}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </header>
        <PhotoCropper imgSrc={imgSrc} spec={selectedSpec} onReset={onReset} />
      </div>
    )
  }

  return (
    <div className={s.app}>
      <header className={cx(s.header, s.headerCentered)}>
        <h1 className={s.logo}>PassportCrop</h1>
        <p className={s.tagline}>Crop your photo to passport standards</p>
        <button
          className={cx(s.themeBtn, s.themeBtnCorner)}
          onClick={toggle}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </header>

      <main className={s.chooseFileScreen}>
        <div>
          <p className={s.specPickerLabel}>Select country standard</p>
          <div className={s.specGrid}>
            {PASSPORT_SPECS.map((spec) => (
              <button
                key={spec.id}
                className={cx(s.specCard, selectedSpec.id === spec.id && s.specCardActive)}
                onClick={() => setSelectedSpec(spec)}
              >
                <span className={s.specFlag}>{spec.flag}</span>
                <span className={s.specName}>{spec.label}</span>
                <span className={s.specDims}>
                  {spec.photoWidthMm}×{spec.photoHeightMm} mm
                </span>
              </button>
            ))}
          </div>
        </div>

        <div
          className={cx(s.dropZone, draggingOver && s.dropZoneDragging)}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDraggingOver(true) }}
          onDragLeave={() => setDraggingOver(false)}
          onDrop={onDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 16V4m0 0L8 8m4-4l4 4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2" strokeLinecap="round" />
          </svg>
          <p className={s.dropText}>Click or drag a photo here</p>
          <p className={s.dropHint}>JPG, PNG, WEBP — any size</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={onFileChange}
          />
        </div>

        <div className={s.requirements}>
          <h3>{selectedSpec.flag} {selectedSpec.label} — {selectedSpec.photoWidthMm}×{selectedSpec.photoHeightMm} mm</h3>
          <ul>
            {selectedSpec.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </main>

      <footer className={s.footer}>
        <p className={s.footerText}>
          Nothing leaves your device — your photos never touch a server.<br />
          Don't believe it? Unplug your internet and try. Works fine, right?
        </p>
      </footer>
    </div>
  )
}
