type BgRemovalModule = typeof import('@imgly/background-removal')

let mod: BgRemovalModule | null = null

async function getMod(): Promise<BgRemovalModule> {
  if (!mod) mod = await import('@imgly/background-removal')
  return mod
}

/**
 * Removes the background from an image element.
 * Returns a blob URL for a PNG with a transparent background.
 * Returns null when __BG_REMOVAL__ is false (tree-shaken at build time).
 *
 * Models are downloaded from CDN on first call and cached by the browser.
 */
export async function removeBackground(img: HTMLImageElement): Promise<string | null> {
  if (!__BG_REMOVAL__) return null

  const { removeBackground: remove } = await getMod()
  // isnet_fp16 = good balance of quality and speed for passport photos
  const blob = await remove(img.src, { model: 'isnet_fp16' })
  return URL.createObjectURL(blob)
}
