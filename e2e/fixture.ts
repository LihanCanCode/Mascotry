import { writeFileSync } from 'node:fs'
import { createCanvas, ImageData } from '@napi-rs/canvas'
import { sketchFace } from '../src/photo/fixtures'
import type { FaceSketch } from '../src/photo/fixtures'

/**
 * A real PNG of a synthetic face, written to disk for the file input to take.
 *
 * The same generator the unit tests read, encoded here so the browser decodes
 * actual image bytes through `createImageBitmap` rather than a buffer the test
 * handed it. That is the part of the photo route a unit test cannot exercise.
 */
export function writeFacePng(path: string, sketch: FaceSketch = { skin: '#8a5a38' }): string {
  const image = sketchFace(sketch)
  const canvas = createCanvas(image.width, image.height)
  const ctx = canvas.getContext('2d')
  ctx.putImageData(new ImageData(new Uint8ClampedArray(image.data), image.width, image.height), 0, 0)
  writeFileSync(path, canvas.toBuffer('image/png'))
  return path
}
