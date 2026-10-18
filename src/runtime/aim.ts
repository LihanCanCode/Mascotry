/**
 * Turning a pointer position into one cell of a 3x3 sprite sheet.
 *
 * The approach here is deliberately grid-shaped rather than angular: each axis
 * is quantised on its own into "before the dead zone", "inside it" or "after
 * it", which lands straight on the three columns and three rows of the sheet.
 * Thinking in two independent axes (instead of one angle split into sectors)
 * keeps the dead zone rectangular, matches how the artwork is laid out, and
 * makes the hysteresis below a one-dimensional problem solved twice.
 */

/** Position along one axis: 0 = low side, 1 = centred, 2 = high side. */
export type Lane = 0 | 1 | 2

/** Cell order is row-major, so index 4 is the straight-ahead pose. */
export const CENTRE_CELL = 4

export interface AimSettings {
  /**
   * How far the pointer must travel from the centre, in pixels, before the
   * head commits to turning on that axis.
   */
  readonly commit: number
  /**
   * How far back toward the centre it must come before the head straightens
   * again. Smaller than `commit`, so a pointer hovering near the boundary does
   * not make the head flicker between two poses.
   */
  readonly release: number
}

export const DEFAULT_AIM: AimSettings = { commit: 46, release: 30 }

export function normaliseSettings(settings: Partial<AimSettings> = {}): AimSettings {
  const commit = Math.max(1, settings.commit ?? DEFAULT_AIM.commit)
  const requested = settings.release ?? DEFAULT_AIM.release
  // Release must stay strictly inside commit or the hysteresis does nothing.
  const release = Math.min(Math.max(0, requested), commit - 1)
  return { commit, release }
}

/**
 * Decides where one axis sits, given where it sat a moment ago.
 * `delta` is the pointer's offset from the element's centre on that axis.
 */
export function quantiseLane(delta: number, previous: Lane, settings: AimSettings): Lane {
  const { commit, release } = settings
  if (previous === 1) {
    if (delta <= -commit) return 0
    if (delta >= commit) return 2
    return 1
  }
  if (previous === 0) {
    if (delta >= commit) return 2
    return delta > -release ? 1 : 0
  }
  if (delta <= -commit) return 0
  return delta < release ? 1 : 2
}

/** Row-major cell index (0..8) for a pointer offset from the element centre. */
export function aimCell(
  dx: number,
  dy: number,
  previous: number,
  settings: AimSettings,
): number {
  const safe = Number.isInteger(previous) && previous >= 0 && previous <= 8 ? previous : CENTRE_CELL
  const column = quantiseLane(dx, (safe % 3) as Lane, settings)
  const row = quantiseLane(dy, Math.floor(safe / 3) as Lane, settings)
  return row * 3 + column
}

/**
 * CSS `background-position` for one cell of a 3x3 sheet drawn at 300% size.
 * Three columns means three stops: 0%, 50% and 100%.
 */
export function cellPosition(cell: number): string {
  const safe = Number.isInteger(cell) && cell >= 0 && cell <= 8 ? cell : CENTRE_CELL
  return `${(safe % 3) * 50}% ${Math.floor(safe / 3) * 50}%`
}
