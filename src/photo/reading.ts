/**
 * A reading, turned into a config.
 *
 * The rule is the whole point: a field is applied only if the reader was
 * confident about it, and otherwise the base config's value stands. So a photo
 * taken in bad light changes the skin tone and leaves everything else as the
 * person had it, rather than scattering guesses across the character.
 */
import { normaliseConfig } from '../studio'
import type { StudioConfig } from '../studio'
import { CONFIDENT } from './types'
import type { PhotoField, PhotoReading } from './types'

const FIELDS: readonly PhotoField[] = ['ears', 'skin', 'hairColor', 'hairStyle', 'facialHair', 'glasses', 'shirt']

/** Just the confident part of a reading, as a config patch. */
export function confidentPatch(reading: PhotoReading): Partial<StudioConfig> {
  let patch: Partial<StudioConfig> = {}
  for (const field of FIELDS) {
    const read = reading.values[field]
    if (read === undefined || read.confidence < CONFIDENT) continue
    patch = { ...patch, [field]: read.value }
  }
  // A cheek ruff belongs to the ears it was drawn for, so it goes with them
  // rather than being left on a human face the ears have just vacated.
  return patch.ears === undefined ? patch : { ...patch, cheekFluff: 'none' }
}

/** `base`, with every confident reading applied to it. */
export function readingToConfig(reading: PhotoReading, base: StudioConfig): StudioConfig {
  return normaliseConfig({ ...base, ...confidentPatch(reading) })
}
