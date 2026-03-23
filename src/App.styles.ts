import { css } from '@emotion/css'
import { tokens } from './styles/tokens.ts'

export const s = {
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

  chooseFileScreen: css`
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

  footer: css`
    padding: 14px 24px;
    text-align: center;
    border-top: 1px solid ${tokens.border};
    flex-shrink: 0;
  `,

  footerText: css`
    font-size: 11px;
    color: ${tokens.textMuted};
    line-height: 1.6;
    opacity: 0.7;
  `,
}
