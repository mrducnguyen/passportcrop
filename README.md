# PassportCrop

A browser-based passport photo editor with AI-powered face detection and background removal. Supports Australian (35×45mm) and US (51×51mm) passport standards.

## Features

- **Manual crop/zoom/pan** — drag, scroll, or pinch-to-zoom to frame your shot
- **Passport overlay** — live guides showing face oval, crown, chin, and eye-level positions
- **Auto face detection** — uses TinyFaceDetector to auto-align the face within passport guides
- **Background removal** — one-click AI removal via ONNX models (runs entirely client-side)
- **Eraser tool** — feathered brush for background cleanup, with undo (Ctrl+Z)
- **Background color picker** — grayscale slider or custom color, applied at export
- **Dark / light theme** — follows system preference, toggleable manually
- **JPEG export** — outputs at 300 DPI per spec (e.g. 413×531px for AU, 600×600px for US)

## Passport Standards

| Country | Size | Output Resolution |
|---------|------|-------------------|
| Australia | 35×45 mm | 413×531 px @ 300 DPI |
| United States | 51×51 mm | 600×600 px @ 300 DPI |

## Tech Stack

- **React 19** + TypeScript, built with **Vite**
- **@vladmandic/face-api** — TinyFaceDetector for face alignment
- **@imgly/background-removal** — ONNX-based background removal (WebGL/WASM)
- **Emotion CSS** — CSS-in-JS styling with dark/light theme tokens
- Models run fully client-side; no images are uploaded to any server

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for production

```bash
pnpm build
pnpm preview
```

## Feature Flags

Features can be toggled via environment variables (create `.env.local` to override):

```env
VITE_FACE_DETECTION=true   # Bundles face detection (~1.5 MB lazy chunk)
VITE_BG_REMOVAL=true       # Bundles background removal (~150 KB + CDN models)
```

Setting either to `false` excludes it from the bundle entirely via dead-code elimination.

## Usage

1. Select your passport standard (AU or US)
2. Upload a photo — face detection runs automatically if enabled
3. Adjust framing with drag / scroll / pinch
4. Optionally remove the background and pick a replacement color
5. Click **Download** to export a spec-compliant JPEG

### Eraser shortcuts

| Key | Action |
|-----|--------|
| `[` | Decrease brush size |
| `]` | Increase brush size |
| `Ctrl+Z` | Undo last stroke |
