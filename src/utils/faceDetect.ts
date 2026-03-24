import type { PassportSpec } from './passportSpecs.ts'
import type { Transform, FrameRect } from './cropImage.ts'

type FaceApiModule = typeof import('@vladmandic/face-api')

let faceapi: FaceApiModule | null = null
let loadPromise: Promise<void> | null = null

async function getApi(): Promise<FaceApiModule> {
  if (!faceapi) faceapi = await import('@vladmandic/face-api')
  return faceapi
}

function loadModels(): Promise<void> {
  if (!loadPromise) {
    const modelUrl = import.meta.env.VITE_FACE_MODELS_URL ?? '/models'
    loadPromise = getApi().then((api) => api.nets.tinyFaceDetector.loadFromUri(modelUrl))
  }
  return loadPromise
}

export interface FaceBox {
  x: number
  y: number
  w: number
  h: number
}

/**
 * Detect the largest face in an image.
 * Returns null if face detection is disabled at build time or no face is found.
 */
export async function detectFace(img: HTMLImageElement): Promise<FaceBox | null> {
  // __FACE_DETECTION__ is replaced with a literal by Vite define.
  // When false, Rollup eliminates everything below (including the dynamic import).
  if (!__FACE_DETECTION__) return null

  const api = await getApi()
  await loadModels()
  const result = await api.detectSingleFace(
    img,
    new api.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 }),
  )
  if (!result) return null
  return { x: result.box.x, y: result.box.y, w: result.box.width, h: result.box.height }
}

/**
 * Compute the transform that positions the detected face to align with the
 * passport spec guide lines inside the given frame.
 */
export function faceToTransform(
  face: FaceBox,
  frame: FrameRect,
  spec: PassportSpec,
  hairPadFraction = 0.28,
): Transform {
  const { crownFraction, chinFraction } = spec.guides

  const hairPad = face.h * hairPadFraction
  const headTopY = face.y - hairPad
  const headH = face.h + hairPad
  const headCenterX = face.x + face.w / 2
  const headCenterY = headTopY + headH / 2

  const targetTop = frame.y + frame.h * crownFraction
  const targetBottom = frame.y + frame.h * chinFraction
  const targetH = targetBottom - targetTop
  const targetCenterX = frame.x + frame.w / 2
  const targetCenterY = targetTop + targetH / 2

  const scale = targetH / headH
  const x = targetCenterX - headCenterX * scale
  const y = targetCenterY - headCenterY * scale

  return { x, y, scale }
}
