/**
 * Turning a cursor path into frames, using the runtime's own logic.
 *
 * The point of doing it this way rather than by hand is that the pose in every
 * frame comes out of `aimCell`, threaded through the whole path so the
 * hysteresis is the real hysteresis, and the reaction in every frame comes out
 * of `poke`. What the animation shows is therefore what a visitor would see,
 * not an impression of it.
 */
import { aimCell, CENTRE_CELL, normaliseSettings } from '../../src/runtime/aim'
import type { AimSettings } from '../../src/runtime/aim'
import { DIZZY_CELL, INITIAL_POKE, MOODS, poke } from '../../src/runtime/poke'
import type { Mood, PokeResult, PokeState } from '../../src/runtime/poke'
import { squashAt } from './mascot'

export interface Point { readonly x: number; readonly y: number }

/** One frame's worth of intent: where the cursor is, and whether it clicked. */
export interface Moment extends Point {
  /** The mood to land on this frame, or null for no poke. */
  readonly poke: Mood | null
}

export interface Frame extends Point {
  readonly cell: number
  readonly mood: number | null
  readonly squash: number
  /** Click-ring progress, 0 to 1, or null when no ring is showing. */
  readonly click: number | null
}

export const CLICK_MS = 300

/** Moods the bag can hand out, derived from the runtime's own exports. */
const BAG: readonly number[] = MOODS.map((_, i) => i).filter((i) => i !== DIZZY_CELL)

/**
 * Drives the real `poke` towards a named mood by choosing that mood's slot in
 * the bag it is about to draw from, and refuses to continue if the result is
 * not what the script asked for — so a change to the poke rules fails the
 * build of the media rather than silently producing the wrong footage.
 *
 * The dizzy streak legitimately overrides a request, so that one is allowed.
 */
export function makePoker(): (now: number, want: Mood) => PokeResult {
  let state: PokeState = INITIAL_POKE
  return (now, want) => {
    const bag = state.bag.length > 0 ? state.bag : BAG
    const wanted = MOODS.indexOf(want)
    const slot = bag.indexOf(wanted)
    const result = poke(state, now, () => (slot < 0 ? 0 : slot))
    state = result.state
    if (result.cell !== wanted && result.cell !== DIZZY_CELL) {
      throw new Error(`poke gave ${String(MOODS[result.cell])} where the script wanted ${want}`)
    }
    return result
  }
}

export interface PerformOptions {
  readonly fps: number
  /** Centre of the mascot element: what the pointer offset is measured against. */
  readonly cx: number
  readonly cy: number
  readonly aim?: Partial<AimSettings>
}

export function perform(moments: readonly Moment[], opts: PerformOptions): readonly Frame[] {
  const settings: AimSettings = normaliseSettings(opts.aim)
  const step = 1000 / opts.fps
  const poker = makePoker()
  const frames: Frame[] = []
  let cell = CENTRE_CELL
  let mood: number | null = null
  let moodUntil = Number.NEGATIVE_INFINITY
  let pokedAt = Number.NEGATIVE_INFINITY

  moments.forEach((moment, i) => {
    const now = i * step
    cell = aimCell(moment.x - opts.cx, moment.y - opts.cy, cell, settings)
    if (moment.poke !== null) {
      const result = poker(now, moment.poke)
      mood = result.cell
      moodUntil = now + result.hold
      pokedAt = now
    } else if (now >= moodUntil) {
      mood = null
    }
    const since = now - pokedAt
    frames.push({
      x: moment.x,
      y: moment.y,
      cell,
      mood,
      squash: squashAt(since),
      click: since >= 0 && since < CLICK_MS ? since / CLICK_MS : null,
    })
  })
  return frames
}

/* ----------------------------- path builders ----------------------------- */

export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t)
}

export interface Orbit {
  readonly cx: number
  readonly cy: number
  readonly rx: number
  readonly ry: number
  /** Where the lap starts, in radians. -PI/2 is straight above the centre. */
  readonly from: number
}

export function orbitAt(orbit: Orbit, turn: number): Point {
  const angle = orbit.from + turn * Math.PI * 2
  return { x: orbit.cx + orbit.rx * Math.cos(angle), y: orbit.cy + orbit.ry * Math.sin(angle) }
}

/** `count` moments around a closed lap, ending one step short of the start. */
export function lap(orbit: Orbit, count: number): readonly Moment[] {
  return Array.from({ length: count }, (_, i) => ({ ...orbitAt(orbit, i / count), poke: null }))
}

/** `count` moments easing from one point to another, excluding `from`. */
export function travel(from: Point, to: Point, count: number): readonly Moment[] {
  return Array.from({ length: count }, (_, i) => {
    const t = easeInOut((i + 1) / count)
    return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t, poke: null }
  })
}

export function still(at: Point, count: number): readonly Moment[] {
  return Array.from({ length: count }, () => ({ ...at, poke: null }))
}

/** A still beat whose first frame carries a poke. */
export function pokeBeat(at: Point, count: number, mood: Mood): readonly Moment[] {
  return Array.from({ length: count }, (_, i) => ({ ...at, poke: i === 0 ? mood : null }))
}
