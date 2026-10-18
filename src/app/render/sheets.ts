/**
 * Drawing and encoding both sheets for one character.
 *
 * This is the only expensive thing the app does: eighteen poses, each a few
 * hundred vector operations, then two image encodes. It lives in its own module
 * with no React and no DOM beyond a canvas, so the worker and the main thread
 * can both run exactly the same code.
 */
import { renderSheet } from '../../studio'
import type { StudioConfig } from '../../studio'
import { canvasFactory, rawImageToBlob } from '../../studio/browser'
import type { SheetMime } from '../state/reducer'

export interface SheetPairResult {
  readonly directions: Blob
  readonly reactions: Blob
  readonly mime: SheetMime
}

/**
 * Both sheets, encoded. WebP is tried first and the format that actually came
 * back decides the second encode, so the pair is never half webp and half png
 * and the download always gets the extension it claims.
 */
export async function renderSheetPair(config: StudioConfig, cell: number): Promise<SheetPairResult> {
  const createCanvas = canvasFactory()
  const poses = renderSheet(config, 'directions', { cell, createCanvas })
  const moods = renderSheet(config, 'reactions', { cell, createCanvas })

  const directions = await rawImageToBlob(poses, 'image/webp')
  const mime: SheetMime = directions.type === 'image/webp' ? 'image/webp' : 'image/png'
  const reactions = await rawImageToBlob(moods, mime)

  return { directions, reactions, mime }
}
