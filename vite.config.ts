import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { cpSync, mkdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

// ─── Feature flag helpers ───────────────────────────────────────────────────

function resolveFlag(key: string, env: Record<string, string>): boolean {
  return (process.env[key] ?? env[key]) === 'true'
}

// ─── Plugins ────────────────────────────────────────────────────────────────

const TINY_FACE_MODELS = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model.bin',
]

/** Removes dist/models/ after a CDN build — public/ is copied automatically by Vite. */
function excludeLocalModelsPlugin(): Plugin {
  return {
    name: 'exclude-local-models',
    closeBundle() {
      rmSync(resolve(process.cwd(), 'dist/models'), { recursive: true, force: true })
    },
  }
}

/** Copies TinyFaceDetector model files into public/models/ before dev/build. */
function copyFaceModelsPlugin(): Plugin {
  return {
    name: 'copy-face-models',
    configResolved(config) {
      const dest = resolve(config.root, 'public/models')
      mkdirSync(dest, { recursive: true })
      for (const file of TINY_FACE_MODELS) {
        cpSync(
          resolve(config.root, `node_modules/@vladmandic/face-api/model/${file}`),
          resolve(dest, file),
        )
      }
      config.logger.info('  ✓ face-api models → public/models/')
    },
  }
}

// ─── Config ─────────────────────────────────────────────────────────────────

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const faceDetection = resolveFlag('VITE_FACE_DETECTION', env)
  const bgRemoval = resolveFlag('VITE_BG_REMOVAL', env)
  const faceModelsCdn = env['VITE_FACE_MODELS_URL'] // set in .env.cdn

  const manualChunks: Record<string, string[]> = {}
  if (faceDetection) manualChunks['face-api'] = ['@vladmandic/face-api']
  if (bgRemoval) manualChunks['bg-removal'] = ['@imgly/background-removal']

  return {
    plugins: [
      react(),
      // Skip local model copy when using CDN — models are fetched at runtime.
      ...(faceDetection && !faceModelsCdn ? [copyFaceModelsPlugin()] : []),
      ...(faceModelsCdn ? [excludeLocalModelsPlugin()] : []),
    ],

    define: {
      __FACE_DETECTION__: faceDetection,
      __BG_REMOVAL__: bgRemoval,
    },

    server: { open: true },

    build: {
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks: Object.keys(manualChunks).length ? manualChunks : undefined,
        },
      },
    },
  }
})
