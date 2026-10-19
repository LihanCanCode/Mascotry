/**
 * Reading the hair: its colour, and as much of its shape as a silhouette can
 * honestly tell you.
 *
 * The band above and beside the head holds three kinds of pixel — the face,
 * the background, and whatever is left. Whatever is left is the hair. How far
 * it rises above the head, how far it falls beside it, and how mottled it is
 * then choose between the styles the studio can draw.
 */
import type { Pixels } from '../image/types'
import type { HairStyle } from '../studio'
import { at, distance, lum, medianColour, SAME_COLOUR, spread } from './pixels'
import type { Rgb } from './pixels'
import { inOval } from './face'
import type { FaceBox } from './types'

export interface HairRead {
  readonly colour: Rgb | null
  readonly style: HairStyle
  readonly colourConfidence: number
  readonly styleConfidence: number
  /** True when the hair is too close to the skin tone to be separated from it. */
  readonly ambiguous: boolean
}

/** Below this share of the band, there is no hair to speak of. */
const BALD = 0.01
/** Below this, there is hair but no shape: a buzz cut. */
const CROPPED = 0.06
/** Mottling, as a share of a 64-level luminance spread, at which hair reads as curled. */
const CURLY = 0.3
/** The head oval is excluded with a margin, so the face's own rim does not read as hair. */
const HEAD_MARGIN = 1.05
/**
 * How close to the skin tone a pixel in the band has to be to be called skin.
 *
 * Tighter than elsewhere on purpose: dark hair on dark skin, and blond hair on
 * pale skin, are genuinely close, and discarding them leaves the reader
 * claiming a bald head it has no business claiming.
 */
const LIKE_SKIN = 55

interface Found {
  readonly colours: readonly Rgb[]
  readonly minY: number
  readonly maxY: number
  readonly minX: number
  readonly maxX: number
  readonly share: number
  readonly skinLike: number
}

/** Collect the band above and beside the head, minus the head and the background. */
function sweep(image: Pixels, head: FaceBox, skin: Rgb, back: Rgb, step: number): Found {
  const top = Math.max(0, Math.round(head.y - head.height * 0.5))
  const bottom = Math.min(image.height, Math.round(head.y + head.height * 0.8))
  const left = Math.max(0, Math.round(head.x - head.width * 0.35))
  const right = Math.min(image.width, Math.round(head.x + head.width * 1.35))
  const colours: Rgb[] = []
  let minY = bottom
  let maxY = top
  let minX = right
  let maxX = left
  let seen = 0
  let skinLike = 0
  for (let y = top; y < bottom; y += step) {
    for (let x = left; x < right; x += step) {
      if (inOval(head, x, y, HEAD_MARGIN)) continue
      seen += 1
      const colour = at(image, x, y)
      if (distance(colour, back) < SAME_COLOUR * 0.5) continue
      if (distance(colour, skin) < LIKE_SKIN) {
        skinLike += 1
        continue
      }
      colours.push(colour)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
    }
  }
  const total = Math.max(1, seen)
  return { colours, minY, maxY, minX, maxX, share: colours.length / total, skinLike: skinLike / total }
}

/** Which style the silhouette looks most like. */
function styleOf(found: Found, head: FaceBox, texture: number): HairStyle {
  if (texture > CURLY) return 'curly'
  const rise = (head.y - found.minY) / head.height
  const fall = (found.maxY - head.y) / head.height
  const wide = (found.maxX - found.minX) / head.width
  if (rise > 0.25 && fall < 0.5 && wide < 1.35) return 'bun'
  if (fall > 0.75) return 'ponytail'
  if (fall > 0.3) return 'bob'
  return 'messy'
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export interface HairContext {
  readonly head: FaceBox
  readonly skin: Rgb
  readonly back: Rgb
  readonly step: number
  /**
   * The skin region came out taller than a face should be, which means the
   * hair was close enough in colour to be swallowed by it. Blond hair on pale
   * skin does this, and the reading has to say so instead of reporting a bald
   * head with a straight face.
   */
  readonly merged: boolean
}

export function readHair(image: Pixels, context: HairContext): HairRead {
  const { head, skin, back, step } = context
  const found = sweep(image, head, skin, back, step)
  const ambiguous = context.merged || found.skinLike > 0.12
  if (found.share < BALD) {
    return { colour: null, style: 'none', colourConfidence: 0, styleConfidence: ambiguous ? 0.3 : 0.6, ambiguous }
  }
  const texture = spread(found.colours.map(lum)) / 64
  const style = found.share < CROPPED ? 'buzz' : styleOf(found, head, texture)
  const strength = clamp01(found.share / 0.12)
  const damp = ambiguous ? 0.35 : 1
  return {
    colour: medianColour(found.colours),
    style,
    colourConfidence: clamp01((0.45 + strength * 0.5) * damp),
    styleConfidence: clamp01((0.45 + strength * 0.4) * damp),
    ambiguous,
  }
}
