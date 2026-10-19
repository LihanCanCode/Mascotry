/**
 * The skin mask: a coarse grid of "could this pixel be skin", and the grouping
 * of that grid into connected regions.
 *
 * Coarse on purpose. A photograph does not need reading at full resolution to
 * be located, and a grid of about a hundred and twenty cells across makes the
 * flood fills and the morphology cheap enough to run on every drop without a
 * worker.
 */
import type { Pixels } from '../image/types'
import { at, isSkin } from './pixels'
import type { FaceBox } from './types'

/** Target grid width, which sets the sampling step. */
const GRID = 120
/** How far the closing reaches, in cells: enough to bridge a pair of glasses. */
const CLOSE_RADIUS = 2

export interface Grid {
  readonly cols: number
  readonly rows: number
  readonly step: number
  readonly skin: readonly boolean[]
}

export function sampleGrid(image: Pixels): Grid {
  const step = Math.max(1, Math.round(Math.max(image.width, image.height) / GRID))
  const cols = Math.floor(image.width / step)
  const rows = Math.floor(image.height / step)
  const skin: boolean[] = new Array<boolean>(cols * rows).fill(false)
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      skin[row * cols + col] = isSkin(at(image, col * step, row * step))
    }
  }
  return { cols, rows, step, skin }
}

/** One separable pass of a max (dilate) or min (erode) filter over the mask. */
function morph(mask: readonly boolean[], cols: number, rows: number, r: number, grow: boolean): boolean[] {
  const pass = (source: readonly boolean[], horizontal: boolean): boolean[] =>
    source.map((_, cell) => {
      const col = cell % cols
      const row = Math.floor(cell / cols)
      for (let d = -r; d <= r; d += 1) {
        const c = horizontal ? col + d : col
        const w = horizontal ? row : row + d
        if (c < 0 || w < 0 || c >= cols || w >= rows) continue
        if ((source[w * cols + c] ?? false) === grow) return grow
      }
      return !grow
    })
  return pass(pass(mask, true), false)
}

/**
 * Close the mask: dilate, then erode by the same amount.
 *
 * This is what lets a face with glasses stay one region. A dark frame cuts a
 * line straight through the skin pixels, and without closing the biggest skin
 * region is the half of the face below the frames, which puts every other
 * measurement in the wrong place.
 */
export function closed(grid: Grid): Grid {
  const grown = morph(grid.skin, grid.cols, grid.rows, CLOSE_RADIUS, true)
  return { ...grid, skin: morph(grown, grid.cols, grid.rows, CLOSE_RADIUS, false) }
}

/** The four cells sharing an edge with this one, inside the grid. */
function neighbours(grid: Grid, cell: number): readonly number[] {
  const col = cell % grid.cols
  const row = Math.floor(cell / grid.cols)
  const around: readonly (readonly [number, number])[] = [
    [col - 1, row], [col + 1, row], [col, row - 1], [col, row + 1],
  ]
  return around
    .filter(([c, r]) => c >= 0 && r >= 0 && c < grid.cols && r < grid.rows)
    .map(([c, r]) => r * grid.cols + c)
}

/**
 * Every cell reachable from `start` without leaving `inside`.
 *
 * An explicit stack rather than recursion: a skin region can be most of a
 * photograph, and a recursive fill over a hundred thousand cells is a stack
 * overflow waiting for the wrong picture.
 */
export function componentFrom(
  grid: Grid,
  start: number,
  seen: Set<number>,
  inside: (cell: number) => boolean,
): readonly number[] {
  const cells: number[] = [start]
  const stack: number[] = [start]
  seen.add(start)
  while (stack.length > 0) {
    const cell = stack.pop()
    if (cell === undefined) continue
    for (const next of neighbours(grid, cell)) {
      if (seen.has(next) || !inside(next)) continue
      seen.add(next)
      cells.push(next)
      stack.push(next)
    }
  }
  return cells
}

/** The largest group of `kept` cells that are connected to each other. */
export function largestGroup(grid: Grid, kept: ReadonlySet<number>): readonly number[] {
  const seen = new Set<number>()
  let best: readonly number[] = []
  for (const cell of kept) {
    if (seen.has(cell)) continue
    const group = componentFrom(grid, cell, seen, (next) => kept.has(next))
    if (group.length > best.length) best = group
  }
  return best
}

/** Every connected skin region in the mask, smallest ones dropped. */
export function regions(grid: Grid, minimum: number): readonly (readonly number[])[] {
  const seen = new Set<number>()
  const found: (readonly number[])[] = []
  for (let cell = 0; cell < grid.skin.length; cell += 1) {
    if (seen.has(cell) || grid.skin[cell] !== true) continue
    const cells = componentFrom(grid, cell, seen, (next) => grid.skin[next] === true)
    if (cells.length >= minimum) found.push(cells)
  }
  return found
}

/** The pixel box a set of cells covers. */
export function boxOf(grid: Grid, cells: readonly number[]): FaceBox {
  const cols = cells.map((cell) => cell % grid.cols)
  const rows = cells.map((cell) => Math.floor(cell / grid.cols))
  const x = Math.min(...cols) * grid.step
  const y = Math.min(...rows) * grid.step
  return {
    x,
    y,
    width: (Math.max(...cols) + 1) * grid.step - x,
    height: (Math.max(...rows) + 1) * grid.step - y,
  }
}

/** Where in the picture a cell sits. */
export function cellPoint(grid: Grid, cell: number): { readonly x: number; readonly y: number } {
  return { x: (cell % grid.cols) * grid.step, y: Math.floor(cell / grid.cols) * grid.step }
}
