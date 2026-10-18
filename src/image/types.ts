/**
 * The pixel buffer every drawing routine in this project produces and consumes.
 *
 * Deliberately minimal so the drawing code stays free of the DOM: the same
 * buffer is produced by a browser canvas, by an OffscreenCanvas inside a
 * worker, or by a headless canvas in tests.
 */
export interface Pixels {
  readonly width: number
  readonly height: number
  /** RGBA, one byte per channel, row-major, straight (non-premultiplied) alpha. */
  readonly data: Uint8ClampedArray
}

/** Anything that can hand us a 2D drawing surface of a given size. */
export type SurfaceFactory = (width: number, height: number) => {
  readonly canvas: { width: number; height: number }
  getContext(kind: '2d'): CanvasRenderingContext2D | null
}

export function pixelCount(image: Pixels): number {
  return image.width * image.height
}

/** Throws when a buffer does not match the dimensions it claims. */
export function assertPixels(image: Pixels): void {
  const expected = pixelCount(image) * 4
  if (image.data.length !== expected) {
    throw new RangeError(
      `pixel buffer is ${image.data.length} bytes, expected ${expected} for ${image.width}x${image.height}`,
    )
  }
}
