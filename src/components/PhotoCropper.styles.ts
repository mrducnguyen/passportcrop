import { css, keyframes } from '@emotion/css'
import { tokens } from '../styles/tokens.ts'

export const s = {
  root: css`
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `,

  toolbar: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 16px;
    background: ${tokens.surface};
    border-bottom: 1px solid ${tokens.border};
    flex-shrink: 0;
  `,

  toolbarLeft: css`
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    align-items: center;
  `,

  btnGhost: css`
    padding: 6px 14px;
    border-radius: ${tokens.radiusSm};
    border: 1px solid ${tokens.border};
    background: transparent;
    color: ${tokens.textMuted};
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
    font-family: ${tokens.fontSans};
    &:hover {
      background: ${tokens.surface2};
      color: ${tokens.text};
    }
  `,

  btnDetect: css`
    padding: 6px 14px;
    border-radius: ${tokens.radiusSm};
    border: 1.5px solid ${tokens.accent};
    background: ${tokens.accentBg};
    color: ${tokens.accent};
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
    font-family: ${tokens.fontSans};
    &:hover:not(:disabled) {
      background: ${tokens.accent};
      color: white;
    }
    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  `,

  btnDetectOn: css`
    background: ${tokens.accent};
    color: white;
  `,

  btnPrimary: css`
    padding: 6px 14px;
    border-radius: ${tokens.radiusSm};
    border: 1px solid ${tokens.accent};
    background: ${tokens.accent};
    color: white;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
    font-family: ${tokens.fontSans};
    &:hover:not(:disabled) {
      background: ${tokens.accentHover};
    }
    &:disabled {
      opacity: 0.5;
      cursor: default;
    }
  `,

  viewport: css`
    flex: 1;
    position: relative;
    overflow: hidden;
    background: #0a0c12;
    touch-action: none;
  `,

  viewportPan: css`
    cursor: grab;
    &:active {
      cursor: grabbing;
    }
  `,
  viewportErase: css`
    cursor: none;
  `,

  eraserSizeBar: css`
    display: flex;
    align-items: center;
    gap: 6px;
  `,

  eraserSizeLabel: css`
    font-size: 11px;
    color: ${tokens.textMuted};
    white-space: nowrap;
  `,

  eraserSizeSlider: css`
    width: 72px;
    height: 4px;
    appearance: none;
    border-radius: 2px;
    background: ${tokens.border};
    outline: none;
    cursor: pointer;
    &::-webkit-slider-thumb {
      appearance: none;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: white;
      border: 2px solid ${tokens.accent};
      cursor: pointer;
    }
    &::-moz-range-thumb {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: white;
      border: 2px solid ${tokens.accent};
      cursor: pointer;
    }
  `,

  infoPanel: css`
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 16px;
    padding: 10px 20px;
    background: ${tokens.surface};
    border-top: 1px solid ${tokens.border};
    flex-shrink: 0;
  `,

  infoSection: css`
    h3 {
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    ul {
      list-style: none;
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    li {
      font-size: 11px;
      color: ${tokens.textMuted};
    }
  `,

  infoHint: css`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    font-size: 11px;
    color: ${tokens.textMuted};
  `,

  // ── Detection overlay ───────────────────────────────────────────────────

  detectOverlay: css`
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    background: ${tokens.overlay};
    backdrop-filter: blur(4px);
    pointer-events: all;
    cursor: wait;
  `,

  spinner: css`
    width: 36px;
    height: 36px;
    border: 3px solid ${tokens.textMuted};
    border-top-color: ${tokens.accent};
    border-radius: 50%;
    animation: ${keyframes`to { transform: rotate(360deg); }`} 0.75s linear infinite;
  `,

  detectOverlayLabel: css`
    font-size: 13px;
    color: ${tokens.text};
    letter-spacing: 0.02em;
  `,

  // ── Result badge ────────────────────────────────────────────────────────

  detectBadge: css`
    position: absolute;
    top: 14px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 6px 16px;
    border-radius: 99px;
    background: ${tokens.panel};
    border: 1px solid ${tokens.border};
    font-size: 12px;
    color: ${tokens.text};
    backdrop-filter: blur(8px);
    pointer-events: none;
    white-space: nowrap;
    animation: ${keyframes`from { opacity: 0; transform: translateX(-50%) translateY(-4px); }`} 0.2s
      ease;
  `,

  detectSuccess: css`
    color: ${tokens.green};
  `,
  detectFail: css`
    color: ${tokens.yellow};
  `,
}
