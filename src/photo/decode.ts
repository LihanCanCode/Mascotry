/**
 * Getting a dropped file to a pixel buffer, in this tab and nowhere else.
 *
 * There is no upload here and there is no request: `createImageBitmap` decodes
 * the bytes the browser already has, a canvas reads them back, and the buffer
 * goes to the pure reader in ./analyse. The file never leaves the page, which
 * is the whole promise of this route and is checked by the end-to-end suite
 * watching for off-origin requests.
 *
 * Three guards, in this order: the file's own first bytes have to say it is an
 * image we know, its size has to be sane, and the decode is capped to a
 * manageable edge so a 50-megapixel photo cannot wedge the tab.
 */
import type { Pixels } from '../image/types'

export type PhotoType = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif'

/** Comfortably over a phone photo, well under anything that would stall a tab. */
export const MAX_BYTES = 16 * 1024 * 1024
/** The longest edge the photo is decoded at. More pixels do not improve the reading. */
export const MAX_EDGE = 1024

function starts(bytes: Uint8Array, signature: readonly number[], offset = 0): boolean {
  return signature.every((byte, i) => bytes[offset + i] === byte)
}

/**
 * The format a file actually is, from its first bytes.
 *
 * Deliberately not from its name or its reported MIME type: both are supplied
 * by whoever made the file. This is the same magic-byte check the end-to-end
 * suite uses on the sheets it downloads, applied in the other direction.
 */
export function sniffImageType(bytes: Uint8Array): PhotoType | null {
  if (starts(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png'
  if (starts(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg'
  if (starts(bytes, [0x52, 0x49, 0x46, 0x46]) && starts(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return 'image/webp'
  if (starts(bytes, [0x47, 0x49, 0x46, 0x38])) return 'image/gif'
  return null
}

/** The size to decode at: the same shape, no edge longer than `max`. */
export function fitWithin(
  width: number,
  height: number,
  max: number = MAX_EDGE,
): { readonly width: number; readonly height: number } {
  const longest = Math.max(width, height)
  if (longest <= max || longest === 0) return { width: Math.max(1, width), height: Math.max(1, height) }
  const scale = max / longest
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

/** Why this file cannot be read, in a sentence a visitor can act on, or null. */
export function fileComplaint(size: number, sniffed: PhotoType | null): string | null {
  if (size === 0) return 'That file is empty.'
  if (size > MAX_BYTES) return `That file is larger than ${Math.round(MAX_BYTES / 1024 / 1024)}MB.`
  if (sniffed === null) return 'That is not a PNG, JPEG, WebP or GIF image.'
  return null
}

function surface(width: number, height: number): CanvasRenderingContext2D {
  const canvas = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(width, height)
    : Object.assign(document.createElement('canvas'), { width, height })
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null
  if (ctx === null) throw new Error('This browser would not give us a 2D canvas to read the photo with.')
  return ctx
}

/**
 * A dropped file as pixels.
 *
 * Throws with a readable message for anything the panel should tell the
 * visitor about: the wrong kind of file, an empty one, one too large, or a
 * decoder that refused it.
 */
export async function readPhoto(file: Blob): Promise<Pixels> {
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  const complaint = fileComplaint(file.size, sniffImageType(head))
  if (complaint !== null) throw new Error(complaint)
  const bitmap = await createImageBitmap(file)
  try {
    const size = fitWithin(bitmap.width, bitmap.height)
    const ctx = surface(size.width, size.height)
    ctx.drawImage(bitmap, 0, 0, size.width, size.height)
    const data = ctx.getImageData(0, 0, size.width, size.height)
    return { width: size.width, height: size.height, data: new Uint8ClampedArray(data.data) }
  } finally {
    bitmap.close()
  }
}
