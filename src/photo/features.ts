/**
 * The three readings taken inside and below the head box: facial hair, glasses
 * and the shirt.
 *
 * Each is deliberately the crudest measurement that could work, because a
 * crude measurement can be explained to the person looking at the result. A
 * beard is "the lower third of the face is darker than the rest of it". Glasses
 * are "something dark runs straight across the eye line". A shirt is "whatever
 * is at the bottom of the picture that is neither skin nor backdrop".
 */
import type { Pixels } from '../image/types'
import type { FacialHair, GlassesStyle } from '../studio'
import { inOval } from './face'
import { at, distance, lum, medianColour, SAME_COLOUR, toHex } from './pixels'
import type { Rgb } from './pixels'
import type { FaceBox, Reading } from './types'

/** How much darker than the skin a pixel has to be to count as hair or frame. */
const BEARD_DROP = 28
const FRAME_DROP = 35
/** Share of the lower face that has to be dark for a beard, and for stubble. */
const BEARDED = 0.28
const STUBBLED = 0.1
/** Share of one row that has to be dark for a line to count as a pair of glasses. */
const BAR = 0.62

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

/** The dark share of the head oval between two fractions of its height. */
function darkShare(
  image: Pixels,
  head: FaceBox,
  band: readonly [number, number],
  floor: number,
  step: number,
): number {
  let seen = 0
  let dark = 0
  const from = Math.max(0, Math.round(head.y + head.height * band[0]))
  const to = Math.min(image.height, Math.round(head.y + head.height * band[1]))
  for (let y = from; y < to; y += step) {
    for (let x = Math.max(0, head.x); x < Math.min(image.width, head.x + head.width); x += step) {
      if (!inOval(head, x, y)) continue
      seen += 1
      if (lum(at(image, x, y)) < floor) dark += 1
    }
  }
  return seen === 0 ? 0 : dark / seen
}

/** A beard, stubble, or nothing, from how dark the jaw is against the cheeks. */
export function readFacialHair(
  image: Pixels,
  head: FaceBox,
  skin: Rgb,
  step: number,
): Reading<FacialHair> | null {
  const share = darkShare(image, head, [0.62, 1], lum(skin) - BEARD_DROP, step)
  if (share < STUBBLED) return { value: 'none', confidence: 0.6 }
  if (share < BEARDED) return { value: 'stubble', confidence: clamp01(0.4 + share) }
  return { value: 'beard', confidence: clamp01(0.45 + share * 0.6) }
}

/**
 * Glasses, from a dark line crossing the eye band.
 *
 * Only the presence is claimed. Round against square is a difference of a few
 * pixels of corner radius at the sizes photographs arrive in, so the shape is
 * the studio's default and the panel says as much.
 */
export function readGlasses(
  image: Pixels,
  head: FaceBox,
  skin: Rgb,
  step: number,
): Reading<GlassesStyle> | null {
  const floor = lum(skin) - FRAME_DROP
  const from = Math.max(0, Math.round(head.y + head.height * 0.3))
  const to = Math.min(image.height, Math.round(head.y + head.height * 0.52))
  let best = 0
  for (let y = from; y < to; y += 1) {
    let seen = 0
    let run = 0
    let longest = 0
    for (let x = Math.max(0, head.x); x < Math.min(image.width, head.x + head.width); x += step) {
      if (!inOval(head, x, y)) continue
      seen += 1
      // The longest unbroken run, not the total: a pair of eyes is two dark
      // patches with a nose between them, and a pair of glasses is one line
      // straight across. Counting every dark pixel cannot tell them apart, and
      // a wrong pair of glasses is worse than a missed one.
      run = lum(at(image, x, y)) < floor ? run + 1 : 0
      longest = Math.max(longest, run)
    }
    if (seen > 0) best = Math.max(best, longest / seen)
  }
  if (best < BAR) return { value: 'none', confidence: clamp01(0.45 + (BAR - best)) }
  return { value: 'round', confidence: clamp01(0.45 + (best - BAR)) }
}

/**
 * The shirt, from the band just below the head: whatever is neither backdrop nor skin.
 *
 * Below the head rather than at the bottom of the picture. The bottom of a
 * full-length photograph is the floor, and a reader that samples it will
 * confidently dress the character in parquet.
 */
export function readShirt(
  image: Pixels,
  head: FaceBox,
  skin: Rgb,
  back: Rgb,
  step: number,
): Reading<string> | null {
  const chin = head.y + head.height
  const from = Math.max(0, Math.round(chin + head.height * 0.1))
  const to = Math.min(image.height, Math.round(chin + head.height * 0.9))
  const left = Math.max(0, Math.round(head.x - head.width * 0.6))
  const right = Math.min(image.width, Math.round(head.x + head.width * 1.6))
  const colours: Rgb[] = []
  let seen = 0
  for (let y = from; y < to; y += step) {
    for (let x = left; x < right; x += step) {
      seen += 1
      const colour = at(image, x, y)
      if (distance(colour, back) < SAME_COLOUR * 0.5) continue
      if (distance(colour, skin) < SAME_COLOUR * 0.5) continue
      colours.push(colour)
    }
  }
  const median = medianColour(colours)
  const share = colours.length / Math.max(1, seen)
  if (median === null || share < 0.2) return null
  return { value: toHex(median), confidence: clamp01(0.3 + share) }
}
