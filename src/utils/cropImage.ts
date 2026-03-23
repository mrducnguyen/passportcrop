import type { PassportSpec } from './passportSpecs.ts'

export interface Transform {
  x: number
  y: number
  scale: number
}

export interface FrameRect {
  x: number
  y: number
  w: number
  h: number
}

/**
 * Crops the source image to the passport frame area and downloads it.
 *
 * The image is rendered with CSS transform: translate(x, y) scale(scale)
 * with transform-origin: 0 0. So a container point (cx, cy) maps to
 * natural image coordinates via:
 *   imgX = (cx - transform.x) / transform.scale
 *   imgY = (cy - transform.y) / transform.scale
 */
export async function cropAndDownload(
  imgEl: HTMLImageElement | HTMLCanvasElement,
  transform: Transform,
  frame: FrameRect,
  spec: PassportSpec,
  bgColor = '#ffffff',
): Promise<void> {
  const canvas = document.createElement('canvas')
  canvas.width = spec.outputWidth
  canvas.height = spec.outputHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Map passport frame corners to source image pixel coordinates
  const srcX = (frame.x - transform.x) / transform.scale
  const srcY = (frame.y - transform.y) / transform.scale
  const srcW = frame.w / transform.scale
  const srcH = frame.h / transform.scale

  ctx.drawImage(
    imgEl,
    srcX, srcY, srcW, srcH,       // source rect in natural image pixels
    0, 0, spec.outputWidth, spec.outputHeight, // destination
  )

  const filename = `passport-photo-${spec.id}-${spec.outputWidth}x${spec.outputHeight}.jpg`

  canvas.toBlob(
    (blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    },
    'image/jpeg',
    0.95,
  )
}
