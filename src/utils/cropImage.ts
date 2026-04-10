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
  // Crop area in source (natural image) pixels
  const srcX = (frame.x - transform.x) / transform.scale
  const srcY = (frame.y - transform.y) / transform.scale
  const srcW = frame.w / transform.scale
  const srcH = frame.h / transform.scale

  // Output at native resolution (1:1 source pixels).
  // srcW/srcH already has the correct passport aspect ratio (frame.w/frame.h = spec ratio).
  // Fall back to the spec's minimum 300 DPI size if the crop area is smaller.
  const rawOutW = Math.round(srcW)
  const rawOutH = Math.round(srcH)
  const outW = rawOutW >= spec.outputWidth ? rawOutW : spec.outputWidth
  const outH = rawOutW >= spec.outputWidth ? rawOutH : spec.outputHeight

  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, outW, outH)

  ctx.drawImage(
    imgEl,
    srcX, srcY, srcW, srcH, // source rect in natural image pixels
    0, 0, outW, outH,        // destination
  )

  const filename = `passport-photo-${spec.id}-${outW}x${outH}.jpg`

  await new Promise<void>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) { reject(new Error('toBlob failed')); return }
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
        resolve()
      },
      'image/jpeg',
      0.95,
    )
  })
}
