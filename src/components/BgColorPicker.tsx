import { useState } from 'react'
import { cx } from '@emotion/css'
import { s } from './BgColorPicker.styles.ts'

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
