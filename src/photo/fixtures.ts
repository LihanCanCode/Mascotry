/**
 * Synthetic photographs, drawn in code.
 *
 * The reader in ./analyse has to be judged against images whose answers are
 * known exactly, and a folder of real faces would be neither original work nor
 * something anyone could check into a repository. So the tests draw their own:
 * a flat skin oval on a plain backdrop, with an optional hair mass, beard band,
 * glasses bar and shirt strip. No canvas and no DOM, so the same generator runs
 * in a unit test, in a Playwright fixture and in the browser.
 *
 * Nothing here is used by the app itself.
 */
import type { Pixels } from '../image/types'

export interface FaceSketch {
  readonly width?: number
  readonly height?: number
  /** Plain backdrop, deliberately not skin-coloured. */
  readonly background?: string
  readonly skin: string
  /** null draws no hair at all. */
  readonly hair?: string | null
  /** How far the hair falls beside the face, in face heights. */
  readonly hairDrop?: number
  /**
   * How thick the hair mass around the crown is, in face heights.
   *
   * The crown wraps down to mid-face, as a real hairline does, so a thin cap
   * (around 0.05) is a buzz cut and anything much thicker already covers the
   * sides of the head.
   */
  readonly hairCap?: number
  readonly bun?: boolean
  /** 0 is a flat block of colour; 1 is strongly mottled, which is what curls look like. */
  readonly texture?: number
  readonly beard?: string | null
  readonly glasses?: boolean
  readonly shirt?: string | null
  /** Eyes and brows, which a face has and a wall does not. On unless turned off. */
  readonly eyes?: boolean
}

interface Rgb {
  readonly r: number
  readonly g: number
  readonly b: number
}

function rgb(hex: string): Rgb {
  const channel = (i: number): number => Number.parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
  return { r: channel(0), g: channel(1), b: channel(2) }
}

/** A deterministic value in -1..1 for a pixel, so a mottled fill is reproducible. */
function jitter(x: number, y: number): number {
  const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return (h - Math.floor(h)) * 2 - 1
}

function shade(colour: Rgb, amount: number): Rgb {
  const lift = (c: number): number => Math.min(255, Math.max(0, Math.round(c + amount * 70)))
  return { r: lift(colour.r), g: lift(colour.g), b: lift(colour.b) }
}

interface Oval {
  readonly cx: number
  readonly cy: number
  readonly rx: number
  readonly ry: number
}

function inside(oval: Oval, x: number, y: number, scale = 1): boolean {
  const dx = (x - oval.cx) / (oval.rx * scale)
  const dy = (y - oval.cy) / (oval.ry * scale)
  return dx * dx + dy * dy <= 1
}

/** Where the face sits in a sketch of this size: centred, upper half, a plausible head ratio. */
export function faceOval(width: number, height: number): Oval {
  return { cx: width / 2, cy: height * 0.44, rx: width * 0.23, ry: height * 0.26 }
}

interface Plan {
  readonly width: number
  readonly height: number
  readonly face: Oval
  readonly sketch: FaceSketch
}

function hairAt(plan: Plan, x: number, y: number): boolean {
  const { face, sketch } = plan
  const top = face.cy - face.ry
  const faceHeight = face.ry * 2
  const cap = sketch.hairCap ?? 0.22
  const grow = 1 + cap * 0.5
  const crown: Oval = { cx: face.cx, cy: face.cy - faceHeight * cap * 0.5, rx: face.rx * grow, ry: face.ry * grow }
  if (inside(crown, x, y) && y < face.cy) return true
  const drop = sketch.hairDrop ?? 0.35
  const beside = Math.abs(x - face.cx) > face.rx * 0.9 && Math.abs(x - face.cx) < face.rx * 1.2
  if (beside && y >= top && y < top + faceHeight * drop) return true
  if (sketch.bun !== true) return false
  const knot = Math.hypot(x - face.cx, y - (top - faceHeight * 0.18))
  return knot < faceHeight * 0.17
}

/** Two eyes and two brows: a dark band across the upper face, which is what the reader looks for. */
function eyeAt(face: Oval, x: number, y: number): boolean {
  const row = face.cy - face.ry * 0.2
  for (const side of [-1, 1]) {
    const cx = face.cx + side * face.rx * 0.42
    const dx = (x - cx) / (face.rx * 0.22)
    const dy = (y - row) / (face.ry * 0.1)
    if (dx * dx + dy * dy <= 1) return true
    const brow = Math.abs(y - (row - face.ry * 0.16)) < Math.max(1, face.ry * 0.035)
    if (brow && Math.abs(x - cx) < face.rx * 0.28) return true
  }
  return false
}

function colourAt(plan: Plan, x: number, y: number): Rgb {
  const { face, sketch } = plan
  const hair = sketch.hair === undefined ? '#2b2230' : sketch.hair
  if (hair !== null && hairAt(plan, x, y) && !inside(face, x, y, 0.99)) {
    const mottle = (sketch.texture ?? 0) * jitter(x, y)
    return shade(rgb(hair), mottle)
  }
  if (inside(face, x, y)) {
    const eyeRow = face.cy - face.ry * 0.2
    if (sketch.glasses === true && Math.abs(y - eyeRow) <= Math.max(2, face.ry * 0.07)) return rgb('#26262e')
    if (sketch.eyes !== false && eyeAt(face, x, y)) return rgb('#2a2026')
    const beard = sketch.beard === undefined ? null : sketch.beard
    if (beard !== null && y > face.cy + face.ry * 0.3) return rgb(beard)
    return rgb(sketch.skin)
  }
  const shirt = sketch.shirt === undefined ? '#3f6fb5' : sketch.shirt
  if (shirt !== null && y > plan.height * 0.84) return rgb(shirt)
  return rgb(sketch.background ?? '#cfd6dd')
}

/** One synthetic photograph as a raw pixel buffer. */
export function sketchFace(sketch: FaceSketch): Pixels {
  const width = sketch.width ?? 180
  const height = sketch.height ?? 220
  const plan: Plan = { width, height, face: faceOval(width, height), sketch }
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const at = (y * width + x) * 4
      const colour = colourAt(plan, x, y)
      data[at] = colour.r
      data[at + 1] = colour.g
      data[at + 2] = colour.b
      data[at + 3] = 255
    }
  }
  return { width, height, data }
}

/** A photograph with no face in it at all: a flat backdrop and a shirt strip. */
export function sketchNoFace(colour = '#4a5a6a'): Pixels {
  const width = 160
  const height = 160
  const data = new Uint8ClampedArray(width * height * 4)
  const fill = rgb(colour)
  for (let i = 0; i < width * height; i += 1) {
    data[i * 4] = fill.r
    data[i * 4 + 1] = fill.g
    data[i * 4 + 2] = fill.b
    data[i * 4 + 3] = 255
  }
  return { width, height, data }
}
