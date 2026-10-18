/**
 * The parts of the demo page worth testing on their own: who is in the cast,
 * and the store that keeps their sheets from being drawn twice.
 */
import { STUDIO_PRESETS } from '../studio'

export interface CastMember {
  readonly id: string
  readonly name: string
  /** What this character does around the allotments. */
  readonly role: string
}

/**
 * Six of the studio's characters, cast as plot buddies. Not all fourteen: a
 * picker is a choice, and six is a choice a person can actually make.
 */
export const DEMO_CAST: readonly CastMember[] = Object.freeze([
  { id: 'fox', name: 'Fennel', role: 'Knows where the compost heap is' },
  { id: 'bunny', name: 'Clover', role: 'Minds the seedling frames' },
  { id: 'bear', name: 'Barley', role: 'Carries the water cans' },
  { id: 'cat', name: 'Nettle', role: 'Supervises, mostly' },
  { id: 'zara', name: 'Rosa', role: 'Runs the Saturday seed swap' },
  { id: 'otto', name: 'Walter', role: 'Has grown onions since 1974' },
])

export function castMember(id: string): CastMember | undefined {
  return DEMO_CAST.find((member) => member.id === id)
}

/** The studio config behind one cast member. */
export function castConfig(id: string): (typeof STUDIO_PRESETS)[number]['config'] | undefined {
  return STUDIO_PRESETS.find((preset) => preset.id === id)?.config
}

export interface SheetUrls {
  readonly directions: string
  readonly reactions: string
}

export interface SheetStoreDeps {
  readonly make: (id: string) => Promise<SheetUrls>
  readonly revoke: (url: string) => void
}

export interface SheetStore {
  get(id: string): Promise<SheetUrls>
  dispose(): void
}

/**
 * Draws each character's sheets once and keeps the URLs.
 *
 * Swapping back and forth in the picker should cost nothing after the first
 * visit, and every object URL handed out holds its image in memory until it is
 * revoked, so the store owns them and releases the lot when the page goes.
 * In-flight promises are cached rather than their results, so two clicks in
 * quick succession cannot start the same render twice.
 */
export function createSheetStore(deps: SheetStoreDeps): SheetStore {
  const pending = new Map<string, Promise<SheetUrls>>()
  const handed: string[] = []

  return {
    get(id: string): Promise<SheetUrls> {
      const already = pending.get(id)
      if (already !== undefined) return already
      const started = deps.make(id).then((urls) => {
        handed.push(urls.directions, urls.reactions)
        return urls
      })
      pending.set(id, started)
      // A failed render must not be remembered as the answer for this id.
      started.catch(() => pending.delete(id))
      return started
    },
    dispose(): void {
      for (const url of handed) deps.revoke(url)
      handed.length = 0
      pending.clear()
    },
  }
}
