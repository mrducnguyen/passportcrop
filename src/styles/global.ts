import { injectGlobal } from '@emotion/css'

export function injectGlobalStyles() {
  injectGlobal`
    :root {
      --bg:           #0f1117;
      --surface:      #1a1d27;
      --surface2:     #22263a;
      --border:       rgba(255,255,255,0.08);
      --border-hover: rgba(255,255,255,0.2);
      --text:         #e8eaf0;
      --text-muted:   rgba(232,234,240,0.5);
      --accent:       #3b82f6;
      --accent-hover: #2563eb;
      --accent-bg:    rgba(59,130,246,0.12);
      --overlay:      rgba(10,12,18,0.72);
      --panel:        rgba(22,25,36,0.95);
    }

    [data-theme="light"] {
      --bg:           #f0f2f5;
      --surface:      #ffffff;
      --surface2:     #e8eaef;
      --border:       rgba(0,0,0,0.1);
      --border-hover: rgba(0,0,0,0.25);
      --text:         #111827;
      --text-muted:   rgba(17,24,39,0.55);
      --accent:       #2563eb;
      --accent-hover: #1d4ed8;
      --accent-bg:    rgba(37,99,235,0.1);
      --overlay:      rgba(240,242,245,0.78);
      --panel:        rgba(255,255,255,0.96);
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body, #root {
      height: 100%;
      font-family: system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      -webkit-font-smoothing: antialiased;
    }
  `
}
