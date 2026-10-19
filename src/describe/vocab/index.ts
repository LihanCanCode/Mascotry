/**
 * The whole vocabulary, flattened into one phrase lookup.
 *
 * Phrases are keyed by their exact word run, so the parser never does fuzzy
 * matching: it asks for the longest run it can see and works down. The longest
 * phrase in the table decides how far ahead it has to look, which is computed
 * here rather than guessed.
 */
import { ANIMAL_WORDS, FACE_WORDS, HAIR_TONES, HAIR_WORDS, SKIN_TONES } from './face'
import { WEAR_GROUPS } from './wear'
import type { VocabEntry } from '../types'

const GROUPS: readonly (readonly VocabEntry[])[] = [
  ANIMAL_WORDS, HAIR_TONES, HAIR_WORDS, SKIN_TONES, FACE_WORDS, ...WEAR_GROUPS,
]

function build(): { readonly table: ReadonlyMap<string, VocabEntry>; readonly longest: number } {
  const table = new Map<string, VocabEntry>()
  let longest = 1
  for (const group of GROUPS) {
    for (const entry of group) {
      for (const phrase of entry.phrases) {
        // First definition wins, so a specific group listed earlier is never
        // overwritten by a looser phrase in a later one.
        if (!table.has(phrase)) table.set(phrase, entry)
        longest = Math.max(longest, phrase.split(' ').length)
      }
    }
  }
  return { table, longest }
}

const BUILT = build()

export const VOCABULARY: ReadonlyMap<string, VocabEntry> = BUILT.table
/** How many words the longest phrase in the table has. */
export const LONGEST_PHRASE = BUILT.longest
/** Every phrase the vocabulary knows, for the panel's own documentation. */
export const PHRASE_COUNT = BUILT.table.size
