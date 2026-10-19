/**
 * The gallery roster, in the order it is browsed: animals first because they are what most people
 * come for, then the jobs and the games, then the neutral faces that lead into the studio.
 */
import { ANIMALS } from './animals'
import { PEOPLE } from './people'
import { PROFESSIONS } from './professions'
import { SPORTS } from './sports'
import { OBJECTS } from './objects'
import type { StudioPreset } from './preset'

export type { PresetTag, StudioPreset } from './preset'

export const STUDIO_PRESETS: readonly StudioPreset[] = Object.freeze([
  ...ANIMALS, ...PROFESSIONS, ...SPORTS, ...PEOPLE, ...OBJECTS,
])
