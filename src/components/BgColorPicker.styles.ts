import { css } from '@emotion/css'
import { tokens } from '../styles/tokens.ts'

export const s = {
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
