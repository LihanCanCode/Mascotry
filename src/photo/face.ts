/**
 * Finding the face, which everything else is measured against.
 *
 * The hard part is not finding skin-coloured pixels — ./mask does that — it is
 * deciding which skin-coloured region is a face. Warm wood, beige walls, sand
 * and carpet all sit inside the skin chroma band, so a photograph taken in a
 * hotel lobby offers a skin-coloured region the size of the whole picture, and
 * an earlier version of this file duly reported the whole frame as a face and
 * dressed the character in the wooden floor.
 *
 * So a region has to behave like a face before it is believed: the right share
 * of the frame, a face-like aspect, dense enough to fill its own box, roughly
 * symmetrical about its own middle, and carrying a band of darker pixels where
 * the eyes and brows belong. When nothing passes, the answer is null, which is
 * a real answer and not a failure.
 */
import type { Pixels } from '../image/types'
import { at, distance, lum, medianColour } from './pixels'
import type { Rgb } from './pixels'
import { boxOf, cellPoint, closed, largestGroup, regions, sampleGrid } from './mask'
import type { Grid } from './mask'
import type { FaceBox } from './types'

export type { Grid } from './mask'
export { sampleGrid } from './mask'

/** Smallest picture worth looking at: under this there is nothing to measure. */
export const MIN_SIDE = 32
/**
 * The face has to be at least this share of the frame, and no more than that.
 *
 * Both ends matter. A region filling half the picture is a wall, a floor or a
 * close-up of an arm; a region under a fiftieth of it is too small to read even
 * if it is a face, and is usually a hand or a stranger in the background.
 */
const MIN_SHARE = 0.02
const MAX_SHARE = 0.4
/**
 * A face is about as tall as it is wide, give or take.
 *
 * The low end is generous because a beard, a scarf or a fringe hides part of
 * the skin, leaving a region wider than it is tall; the high end is what keeps
 * a wall or a door frame out.
 */
const MIN_ASPECT = 0.7
const MAX_ASPECT = 1.9
/** The face box may not swallow the picture, whatever the cell count says. */
const MAX_BOX_SHARE = 0.45
/** How much of its own bounding box the region has to fill. */
const MIN_DENSITY = 0.55
/** How much of the region has to mirror itself about its own middle. */
const MIN_SYMMETRY = 0.62
/** Where the eyes and the cheeks sit in the head box, as fractions of its height. */
const EYE_BAND: readonly [number, number] = [0.25, 0.52]
const CHEEK_BAND: readonly [number, number] = [0.54, 0.64]
/** How much of the eye band has to be darker than the face, and how much is too much. */
const EYE_DARK_MIN = 0.02
const EYE_DARK_MAX = 0.55
/** How much darker than the skin median a pixel counts as an eye or a brow. */
const EYE_DROP = 22
/**
 * How far a cell may sit from the region's median and still be the same face.
 *
 * Tighter than the general same-colour threshold: it is what separates a fringe
 * from a forehead, and blond hair is only just outside it.
 */
const LIKE_FACE = 70
/** How much of a region has to survive the narrowing for it to still mean anything. */
const MIN_KEPT = 0.3
/** The share of a region taken as "the middle of the frame" when re-measuring it. */
const MIDDLE = 0.12

/**
 * The luminance below which a pixel is an eye or a brow.
 *
 * Proportional as well as absolute, because a fixed drop of 22 levels is most
 * of the way to black on deep skin: on a dark face everything would have to be
 * nearly black to count, and the face would be refused for having no eyes.
 */
function eyeFloor(skin: Rgb): number {
  const level = lum(skin)
  return Math.max(level - EYE_DROP, level * 0.8)
}

export interface FaceFind {
  readonly box: FaceBox
  readonly skin: Rgb
  /** How much of the frame the region covered, which is also how sure we are. */
  readonly share: number
}

/** Area, weighted down the further the region's middle sits from the frame's middle. */
function score(grid: Grid, cells: readonly number[]): number {
  let sx = 0
  let sy = 0
  for (const cell of cells) {
    sx += cell % grid.cols
    sy += Math.floor(cell / grid.cols)
  }
  const dx = (sx / cells.length - grid.cols / 2) / (grid.cols / 2)
  const dy = (sy / cells.length - grid.rows / 2) / (grid.rows / 2)
  return cells.length * Math.max(0.1, 1 - 0.5 * Math.hypot(dx, dy))
}

/** Every skin region worth considering, best placed first. */
function candidates(grid: Grid): readonly (readonly number[])[] {
  const found = regions(grid, grid.skin.length * MIN_SHARE)
  return [...found]
    .map((cells) => ({ cells, value: score(grid, cells) }))
    .sort((a, b) => b.value - a.value)
    .map((entry) => entry.cells)
}

/** Drop the cells whose colour is nothing like the region's median, then re-measure. */
function narrow(image: Pixels, grid: Grid, cells: readonly number[]): FaceFind | null {
  const colourOf = (cell: number): Rgb => {
    const point = cellPoint(grid, cell)
    return at(image, point.x, point.y)
  }
  const colours = cells.map(colourOf)
  const median = medianColour(colours)
  if (median === null) return null
  const kept = cells.filter((_, i) => distance(colours[i] ?? median, median) <= LIKE_FACE)
  if (kept.length < cells.length * MIN_KEPT) return null
  return {
    box: boxOf(grid, kept),
    skin: medianColour(kept.map(colourOf)) ?? median,
    share: kept.length / grid.skin.length,
  }
}

/** How much of the region mirrors itself about its own middle. A face does; a floor does not. */
function symmetry(grid: Grid, cells: readonly number[]): number {
  const set = new Set(cells)
  const cols = cells.map((cell) => cell % grid.cols)
  const rows = cells.map((cell) => Math.floor(cell / grid.cols))
  const left = Math.min(...cols)
  const right = Math.max(...cols)
  let agree = 0
  let total = 0
  for (let row = Math.min(...rows); row <= Math.max(...rows); row += 1) {
    for (let col = left; col <= right; col += 1) {
      total += 1
      if (set.has(row * grid.cols + col) === set.has(row * grid.cols + (left + right - col))) agree += 1
    }
  }
  return total === 0 ? 0 : agree / total
}

/** The share of a band of the box that is markedly darker than the skin. */
function darkIn(image: Pixels, box: FaceBox, band: readonly [number, number], floor: number): number {
  let seen = 0
  let dark = 0
  const from = Math.max(0, Math.round(box.y + box.height * band[0]))
  const to = Math.min(image.height, Math.round(box.y + box.height * band[1]))
  for (let y = from; y < to; y += 1) {
    for (let x = Math.max(0, box.x); x < Math.min(image.width, box.x + box.width); x += 1) {
      if (!inOval(box, x, y)) continue
      seen += 1
      if (lum(at(image, x, y)) < floor) dark += 1
    }
  }
  return seen === 0 ? 0 : dark / seen
}

/** Is this region the right size and shape to be a face at all? */
function shaped(image: Pixels, grid: Grid, cells: readonly number[], found: FaceFind): boolean {
  const aspect = found.box.height / Math.max(1, found.box.width)
  if (aspect < MIN_ASPECT || aspect > MAX_ASPECT) return false
  const box = found.box.width * found.box.height
  if (box > image.width * image.height * MAX_BOX_SHARE) return false
  // A face fills about four fifths of its own box. A scattering of wall tiles
  // across the picture can be few enough cells to pass the size test while its
  // box still covers everything, and this is what catches that.
  if ((cells.length * grid.step * grid.step) / Math.max(1, box) < MIN_DENSITY) return false
  return symmetry(grid, cells) >= MIN_SYMMETRY
}

/** Does it have eyes? The one test a blank wall of exactly the right shape still fails. */
function hasEyes(image: Pixels, found: FaceFind): boolean {
  // Measured against the head estimate, not against the skin region: a beard
  // or a scarf cuts the skin region short, and bands taken as fractions of a
  // short box land in the wrong places.
  const head = headBox(found.box, image)
  const floor = eyeFloor(found.skin)
  const eyes = darkIn(image, head, EYE_BAND, floor)
  if (eyes < EYE_DARK_MIN || eyes > EYE_DARK_MAX) return false
  // The eye band has to be darker than the cheeks right below it, or what was
  // found is a shadow across the whole region rather than a pair of eyes.
  return eyes > darkIn(image, head, CHEEK_BAND, floor)
}

/** A region, if it is the right size and behaves like a face. */
function accept(image: Pixels, grid: Grid, cells: readonly number[]): FaceFind | null {
  if (cells.length < grid.skin.length * MIN_SHARE) return null
  if (cells.length > grid.skin.length * MAX_SHARE) return null
  const found = narrow(image, grid, cells)
  if (found === null) return null
  if (!shaped(image, grid, cells, found) || !hasEyes(image, found)) return null
  return found
}

/**
 * A second look at a region that was the wrong size or shape.
 *
 * A person photographed against a warm wall gives one region holding both the
 * wall and the face, because wood and skin are neighbours in chroma. The face
 * is still the thing in the middle of the frame, though, so the colour of the
 * cells nearest the middle is taken as the face's own colour, everything
 * unlike it is dropped, and what is left is re-grouped. If the wall really is
 * the same colour as the face, nothing is dropped and the region stays too
 * large — which is the honest answer, and the caller refuses it.
 */
function recentre(image: Pixels, grid: Grid, cells: readonly number[]): readonly number[] | null {
  const colourOf = (cell: number): Rgb => {
    const point = cellPoint(grid, cell)
    return at(image, point.x, point.y)
  }
  const away = (cell: number): number =>
    Math.hypot((cell % grid.cols) - grid.cols / 2, Math.floor(cell / grid.cols) - grid.rows / 2)
  const middle = [...cells]
    .sort((a, b) => away(a) - away(b))
    .slice(0, Math.max(9, Math.round(cells.length * MIDDLE)))
  const median = medianColour(middle.map(colourOf))
  if (median === null) return null
  const kept = new Set(cells.filter((cell) => distance(colourOf(cell), median) <= LIKE_FACE))
  if (kept.size === cells.length || kept.size < grid.skin.length * MIN_SHARE) return null
  const best = largestGroup(grid, kept)
  return best.length === 0 ? null : best
}

/**
 * The face in this picture, or null.
 *
 * Null is a real answer here, not a failure: a photograph of a wall, a room, or
 * a person standing far enough away that their face is a fiftieth of the frame
 * is better refused than guessed at. Every skin region is considered, best
 * placed first, and the first one that behaves like a face is taken.
 */
export function findFace(image: Pixels): FaceFind | null {
  if (image.width < MIN_SIDE || image.height < MIN_SIDE) return null
  const grid = closed(sampleGrid(image))
  for (const cells of candidates(grid)) {
    const direct = accept(image, grid, cells)
    if (direct !== null) return direct
    const centred = recentre(image, grid, cells)
    if (centred === null) continue
    const second = accept(image, grid, centred)
    if (second !== null) return second
  }
  return null
}

/**
 * The whole head, estimated from the face box.
 *
 * The skin region stops at a beard or a fringe, so the bands that look for
 * those cannot be measured against it. A front-on head is about 1.35 times as
 * tall as it is wide, which is enough to put the bands in the right place.
 */
export function headBox(face: FaceBox, image: Pixels): FaceBox {
  const height = Math.min(Math.max(face.height, face.width * 1.35), image.height - face.y)
  return { x: face.x, y: face.y, width: face.width, height }
}

/** True when (x, y) is inside the oval that fills `box`. */
export function inOval(box: FaceBox, x: number, y: number, scale = 1): boolean {
  const dx = (x - (box.x + box.width / 2)) / ((box.width / 2) * scale)
  const dy = (y - (box.y + box.height / 2)) / ((box.height / 2) * scale)
  return dx * dx + dy * dy <= 1
}
