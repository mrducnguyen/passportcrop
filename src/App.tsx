import { useState, useCallback, useRef } from 'react'
import { css, cx } from '@emotion/css'
import PhotoCropper from './components/PhotoCropper.tsx'
import { PASSPORT_SPECS, type PassportSpec } from './utils/passportSpecs.ts'
import { tokens } from './styles/tokens.ts'
import { useTheme } from './hooks/useTheme.ts'

// ─── Styles ────────────────────────────────────────────────────────────────

const s = {
  app: css`
    display: flex;
    flex-direction: column;
    height: 100dvh;
    overflow: hidden;
  `,

  header: css`
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 10px 20px;
    border-bottom: 1px solid ${tokens.border};
    background: ${tokens.surface};
    flex-shrink: 0;
  `,

  headerCentered: css`
    justify-content: center;
    flex-direction: column;
    padding: 32px 20px 20px;
    border-bottom: none;
    background: transparent;
    position: relative;
  `,

  logo: css`
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.5px;
    color: ${tokens.text};
  `,

  tagline: css`
    font-size: 14px;
    color: ${tokens.textMuted};
    margin-top: 4px;
  `,

  specSwitcher: css`
    display: flex;
    gap: 6px;
    margin-left: auto;
  `,

  specBtn: css`
    padding: 5px 12px;
    border-radius: ${tokens.radiusSm};
    border: 1px solid ${tokens.border};
    background: transparent;
    color: ${tokens.textMuted};
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
    &:hover {
      color: ${tokens.text};
      border-color: ${tokens.borderHover};
    }
  `,

  specBtnActive: css`
    background: ${tokens.accent};
    color: white;
    border-color: ${tokens.accent};
  `,

  themeBtn: css`
    padding: 4px 9px;
    border-radius: ${tokens.radiusSm};
    border: 1px solid ${tokens.border};
    background: transparent;
    color: ${tokens.textMuted};
    font-size: 15px;
    line-height: 1;
    cursor: pointer;
    transition: all 0.15s;
    flex-shrink: 0;
    &:hover {
      color: ${tokens.text};
      border-color: ${tokens.borderHover};
    }
  `,

  themeBtnCorner: css`
    position: absolute;
    top: 12px;
    right: 16px;
  `,

  uploadScreen: css`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 28px;
    padding: 24px;
    overflow-y: auto;
  `,

  specPickerLabel: css`
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: ${tokens.textMuted};
    margin-bottom: 12px;
    text-align: center;
  `,

  specGrid: css`
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  `,

  specCard: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 16px 24px;
    border-radius: ${tokens.radius};
    border: 1.5px solid ${tokens.border};
    background: ${tokens.surface};
    color: ${tokens.text};
    cursor: pointer;
    transition: all 0.15s;
    min-width: 130px;
    &:hover {
      border-color: ${tokens.borderHover};
      background: ${tokens.surface2};
    }
  `,

  specCardActive: css`
    border-color: ${tokens.accent};
    background: ${tokens.accentBg};
  `,

  specFlag: css`font-size: 28px;`,
  specName: css`font-size: 13px; font-weight: 600;`,
  specDims: css`font-size: 11px; color: ${tokens.textMuted};`,

  dropZone: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    max-width: 420px;
    padding: 40px 24px;
    border-radius: ${tokens.radius};
    border: 2px dashed ${tokens.border};
    background: ${tokens.surface};
    color: ${tokens.textMuted};
    cursor: pointer;
    transition: all 0.15s;
    &:hover {
      border-color: ${tokens.accent};
      background: ${tokens.accentBg};
      color: ${tokens.text};
    }
  `,

  dropZoneDragging: css`
    border-color: ${tokens.accent};
    background: ${tokens.accentBg};
    color: ${tokens.text};
  `,

  dropText: css`font-size: 15px; font-weight: 500;`,
  dropHint: css`font-size: 12px;`,

  requirements: css`
    max-width: 420px;
    width: 100%;
    background: ${tokens.surface};
    border-radius: ${tokens.radius};
    padding: 16px 20px;
    border: 1px solid ${tokens.border};
    h3 {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 10px;
    }
    ul {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    li {
      font-size: 12px;
      color: ${tokens.textMuted};
      padding-left: 14px;
      position: relative;
      &::before {
        content: '✓';
        position: absolute;
        left: 0;
        color: ${tokens.green};
        font-size: 11px;
      }
    }
  `,
}

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

      <main className={s.uploadScreen}>
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
    </div>
  )
}
