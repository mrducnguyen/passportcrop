import { useState } from 'react'
import { css, cx } from '@emotion/css'
import { tokens } from '../styles/tokens.ts'

// ─── Color helpers ──────────────────────────────────────────────────────────

const GRAY_MIN = 163 // #a3 — darkest allowed (#a3a3a3)
const GRAY_MAX = 255 // #ff — pure white

/** Convert slider value 0–100 → grey hex (#ffffff … #a3a3a3) */
function graySliderToHex(v: number): string {
  const ch = Math.round(GRAY_MAX - (v / 100) * (GRAY_MAX - GRAY_MIN))
  const h = ch.toString(16).padStart(2, '0')
  return `#${h}${h}${h}`
}

const DEFAULT_CUSTOM = '#b8d4f0'

// ─── Styles ─────────────────────────────────────────────────────────────────

const s = {
  bar: css`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 7px 16px;
    background: ${tokens.surface};
    border-bottom: 1px solid ${tokens.border};
    flex-shrink: 0;
    flex-wrap: wrap;
  `,

  label: css`
    font-size: 11px;
    color: ${tokens.textMuted};
    text-transform: uppercase;
    letter-spacing: 0.07em;
    white-space: nowrap;
  `,

  sliderWrap: css`
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 140px;
    max-width: 240px;
  `,

  sliderLabel: css`
    font-size: 10px;
    color: ${tokens.textMuted};
    white-space: nowrap;
  `,

  slider: css`
    flex: 1;
    height: 4px;
    appearance: none;
    border-radius: 2px;
    outline: none;
    cursor: pointer;
    &::-webkit-slider-thumb {
      appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: white;
      border: 2px solid ${tokens.accent};
      cursor: pointer;
    }
    &::-moz-range-thumb {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: white;
      border: 2px solid ${tokens.accent};
      cursor: pointer;
    }
  `,

  customWrap: css`
    display: flex;
    align-items: center;
    gap: 7px;
  `,

  colorInput: css`
    width: 26px;
    height: 26px;
    border-radius: 4px;
    border: 2px solid ${tokens.border};
    padding: 1px;
    cursor: pointer;
    background: transparent;
    flex-shrink: 0;
    &:hover { border-color: ${tokens.accent}; }
  `,

  colorInputActive: css`
    border-color: ${tokens.accent};
    box-shadow: 0 0 0 2px ${tokens.accentBg};
  `,

  hexLabel: css`
    font-size: 11px;
    color: ${tokens.textMuted};
    font-family: monospace;
    min-width: 52px;
  `,
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  value: string
  onChange: (color: string) => void
}

export default function BgColorPicker({ value, onChange }: Props) {
  const [grayValue, setGrayValue] = useState(0)
  const [customColor, setCustomColor] = useState(DEFAULT_CUSTOM)
  // 'gray' = slider is driving the value; 'custom' = color picker is driving it
  const [active, setActive] = useState<'gray' | 'custom'>('gray')

  function onSliderChange(v: number) {
    setGrayValue(v)
    setActive('gray')
    onChange(graySliderToHex(v))
  }

  function onCustomChange(hex: string) {
    setCustomColor(hex)
    setActive('custom')
    onChange(hex)
  }

  return (
    <div className={s.bar}>
      <span className={s.label}>Background</span>

      <div className={s.sliderWrap}>
        <span className={s.sliderLabel}>White</span>
        <input
          type="range"
          min={0}
          max={100}
          value={active === 'gray' ? grayValue : 0}
          className={s.slider}
          style={{ background: 'linear-gradient(to right, #ffffff, #a3a3a3)' }}
          onChange={(e) => onSliderChange(Number(e.target.value))}
        />
        <span className={s.sliderLabel}>Grey</span>
      </div>

      <div className={s.customWrap}>
        <input
          type="color"
          value={active === 'custom' ? customColor : DEFAULT_CUSTOM}
          className={cx(s.colorInput, active === 'custom' && s.colorInputActive)}
          title="Custom colour"
          onChange={(e) => onCustomChange(e.target.value)}
        />
        <span className={s.hexLabel}>{value.toUpperCase()}</span>
      </div>
    </div>
  )
}
