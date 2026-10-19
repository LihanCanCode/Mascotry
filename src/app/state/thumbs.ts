/**
 * A small bounded cache for rendered thumbnails.
 *
 * Drawing one card costs a few milliseconds and a 128px thumbnail is 64KB of
 * RGBA, so the grid wants to draw each character once and then never again,
 * but it does not want to hold every size of every character forever. A Map
 * keeps insertion order, and re-reading an entry moves it to the back, which
 * gives least-recently-used eviction without a second data structure.
 */
import { STUDIO_PRESETS } from '../../studio'
import type { Pixels } from '../../image/types'

export interface ThumbCache {
  /** The thumbnail for `id`, drawn with `draw` the first time it is asked for. */
  get(id: string, draw: () => Pixels): Pixels
  has(id: string): boolean
  clear(): void
  readonly size: number
}

/**
 * Big enough for the whole roster plus room to grow. A limit under the number of cards would
 * evict a thumbnail the grid is still showing and redraw it on the next scroll, which is the
 * one thing the cache exists to prevent.
 */
export const THUMB_LIMIT = STUDIO_PRESETS.length + 16

export function createThumbCache(limit: number = THUMB_LIMIT): ThumbCache {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError(`cache limit must be a positive integer, got ${limit}`)
  }
  const entries = new Map<string, Pixels>()

  const touch = (id: string, value: Pixels): Pixels => {
    entries.delete(id)
    entries.set(id, value)
    return value
  }

  return {
    get(id: string, draw: () => Pixels): Pixels {
      const held = entries.get(id)
      if (held !== undefined) return touch(id, held)
      // Draw outside the map, so a throw leaves nothing half-cached.
      const drawn = draw()
      entries.set(id, drawn)
      if (entries.size > limit) {
        const oldest = entries.keys().next()
        if (oldest.done !== true) entries.delete(oldest.value)
      }
      return drawn
    },
    has(id: string): boolean {
      return entries.has(id)
    },
    clear(): void {
      entries.clear()
    },
    get size(): number {
      return entries.size
    },
  }
}
