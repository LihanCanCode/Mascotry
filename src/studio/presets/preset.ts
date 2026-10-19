// The shape of a gallery entry, and the helper every group file builds its entries with.
import { normaliseConfig } from '../config'
import type { StudioConfig } from '../types'

/** How the gallery filters. Entries are named by what they are, never by a given name. */
export type PresetTag = 'animal' | 'profession' | 'sport' | 'person' | 'object'

export interface StudioPreset {
  readonly id: string
  readonly name: string
  readonly tag: PresetTag
  readonly config: StudioConfig
}

/** Build one frozen, fully-validated gallery entry. */
export const make = (tag: PresetTag) =>
  (id: string, name: string, config: Partial<StudioConfig>): StudioPreset =>
    Object.freeze({ id, name, tag, config: normaliseConfig(config) })
