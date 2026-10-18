/**
 * What happens when somebody pokes the mascot.
 *
 * Two small rules drive it. First, the mood is drawn from a bag that is
 * refilled only once empty, so a run of pokes shows every mood before any
 * repeats: random-feeling without the clumping real randomness gives you.
 * Second, pokes that land in quick succession build a streak, and a long
 * enough streak overrides the bag with the dizzy pose. Poke gently and the
 * mascot is cheerful; hammer it and you make it giddy.
 */

/** Cell order of the reactions sheet, row-major. */
export const MOODS = [
  'blink',
  'heart',
  'sparkle',
  'surprised',
  'starstruck',
  'bashful',
  'sleepy',
  'dizzy',
  'delighted',
] as const

export type Mood = (typeof MOODS)[number]

export const DIZZY_CELL = MOODS.indexOf('dizzy')

/** Moods the bag may hand out. Dizzy is reserved for the streak. */
const BAG_MOODS: readonly number[] = MOODS.map((_, index) => index).filter((i) => i !== DIZZY_CELL)

/** Pokes closer together than this keep the streak alive. */
export const STREAK_GAP_MS = 1400
/** Pokes in a streak needed before the mascot goes dizzy. */
export const STREAK_FOR_DIZZY = 4
/** How long a normal reaction stays on screen. */
export const HOLD_MS = 620
/** Dizzy lingers a little, because it is the punchline. */
export const DIZZY_HOLD_MS = 1100

export interface PokeState {
  /** Moods not yet drawn from the current bag. */
  readonly bag: readonly number[]
  readonly streak: number
  readonly lastPokeAt: number
}

export const INITIAL_POKE: PokeState = { bag: [], streak: 0, lastPokeAt: Number.NEGATIVE_INFINITY }

export interface PokeResult {
  readonly state: PokeState
  /** Cell of the reactions sheet to show. */
  readonly cell: number
  /** How long to show it, in milliseconds. */
  readonly hold: number
}

/**
 * Advances the poke state. `pick` chooses an index into the remaining bag and
 * defaults to Math.random, so tests can make it deterministic.
 */
export function poke(
  state: PokeState,
  now: number,
  pick: (upperBound: number) => number = (n) => Math.floor(Math.random() * n),
): PokeResult {
  const continues = now - state.lastPokeAt <= STREAK_GAP_MS
  const streak = continues ? state.streak + 1 : 1

  if (streak >= STREAK_FOR_DIZZY) {
    return {
      state: { bag: [], streak: 0, lastPokeAt: now },
      cell: DIZZY_CELL,
      hold: DIZZY_HOLD_MS,
    }
  }

  const bag = state.bag.length > 0 ? state.bag : BAG_MOODS
  const index = clampIndex(pick(bag.length), bag.length)
  const cell = bag[index] ?? DIZZY_CELL
  const remaining = bag.filter((_, i) => i !== index)

  return { state: { bag: remaining, streak, lastPokeAt: now }, cell, hold: HOLD_MS }
}

function clampIndex(value: number, length: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(Math.max(Math.floor(value), 0), Math.max(0, length - 1))
}
