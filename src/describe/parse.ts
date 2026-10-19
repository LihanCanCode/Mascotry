/**
 * Words to a character, deterministically.
 *
 * There is no model here and nothing is sent anywhere. The description is cut
 * into words, the longest run of words that the vocabulary knows is taken as
 * one phrase, and each phrase contributes a partial config. Three rules do all
 * the interesting work:
 *
 * - **Longest first.** "hard hat" is read before "hat", and "square glasses"
 *   before "square", so a specific phrase is never shadowed by a word inside it.
 * - **Colours look for a home.** A colour word takes the colour slot of the
 *   nearest phrase that names one, preferring the phrase after it, which is how
 *   "a red scarf" and "hair, dark brown" both land in the right field.
 * - **Nothing is invented.** Words that matched nothing come back in `ignored`
 *   so the panel can say what it did not understand instead of quietly guessing.
 */
import { normaliseConfig } from '../studio'
import type { StudioConfig } from '../studio'
import { compoundColour } from './colours'
import type { Hex } from './colours'
import type { ColourSlot, DescribeResult, VocabEntry } from './types'
import { LONGEST_PHRASE, VOCABULARY } from './vocab'
import { FILLER, NEGATORS, STOPWORDS, tokenise } from './words'

interface Hit {
  readonly from: number
  readonly length: number
  readonly phrase: string
  readonly entry?: VocabEntry
  readonly colour?: Hex
  readonly negated: boolean
}

/** What "no <part>" sets. Keys missing from here cannot be turned off, only chosen. */
const OFF_VALUES: Readonly<Record<string, string | boolean>> = {
  hairStyle: 'none', glasses: 'none', facialHair: 'none', headwear: 'none', eyePatch: 'none',
  neckAccessory: 'none', sideAccessory: 'none', shirtDetail: 'none', cheekFluff: 'none',
  lashes: 'none', blush: false,
}

/** Where an unattached colour goes, in order. A third one has nowhere sensible to land. */
const DEFAULT_SLOTS: readonly ColourSlot[] = ['shirt', 'accent']
/** How many phrases away a colour will look for something to colour. */
const COLOUR_REACH = 3

function negatedAt(tokens: readonly string[], from: number): boolean {
  let index = from - 1
  while (index >= 0 && FILLER.has(tokens[index] ?? '')) index -= 1
  return index >= 0 && NEGATORS.has(tokens[index] ?? '')
}

/** The one phrase starting at `from`, longest first, or null. */
function hitAt(tokens: readonly string[], from: number): Hit | null {
  const reach = Math.min(LONGEST_PHRASE, tokens.length - from)
  for (let length = reach; length >= 1; length -= 1) {
    const words = tokens.slice(from, from + length)
    const phrase = words.join(' ')
    const negated = negatedAt(tokens, from)
    const entry = VOCABULARY.get(phrase)
    if (entry !== undefined) return { from, length, phrase, entry, negated }
    const colour = compoundColour(words)
    if (colour !== null) return { from, length, phrase, colour, negated }
  }
  return null
}

function scan(tokens: readonly string[]): readonly Hit[] {
  const hits: Hit[] = []
  let index = 0
  while (index < tokens.length) {
    const hit = hitAt(tokens, index)
    if (hit === null) {
      index += 1
      continue
    }
    hits.push(hit)
    index += hit.length
  }
  return hits
}

/** The patch a phrase contributes, taking its negation into account. */
function patchFor(hit: Hit): Partial<StudioConfig> | null {
  const entry = hit.entry
  if (entry === undefined) return null
  if (!hit.negated) return entry.patch ?? null
  if (entry.off !== undefined) return entry.off
  const off: Record<string, string | boolean> = {}
  for (const key of Object.keys(entry.patch ?? {})) {
    const value = OFF_VALUES[key]
    if (value !== undefined) off[key] = value
  }
  // Nothing here can be turned off, so "no oval face" still means an oval face.
  return Object.keys(off).length > 0 ? (off as Partial<StudioConfig>) : (entry.patch ?? null)
}

/** The slot a colour at `index` belongs to: the nearest phrase that names one, else a default. */
function slotFor(hits: readonly Hit[], index: number, spare: ColourSlot[]): ColourSlot | null {
  for (let step = 1; step <= COLOUR_REACH; step += 1) {
    const slot = hits[index + step]?.entry?.colourSlot
    if (slot !== undefined) return slot
  }
  for (let step = 1; step <= COLOUR_REACH; step += 1) {
    const slot = hits[index - step]?.entry?.colourSlot
    if (slot !== undefined) return slot
  }
  return spare.shift() ?? null
}

/** Every phrase's patch, then every colour on top of it. */
function merge(hits: readonly Hit[]): Partial<StudioConfig> {
  let patch: Partial<StudioConfig> = {}
  for (const hit of hits) {
    const part = patchFor(hit)
    if (part !== null) patch = { ...patch, ...part }
  }
  const spare = [...DEFAULT_SLOTS]
  for (const [index, hit] of hits.entries()) {
    if (hit.colour === undefined) continue
    const slot = slotFor(hits, index, spare)
    if (slot !== null) patch = { ...patch, [slot]: hit.colour }
  }
  return patch
}

/** Tokens no phrase covered, minus the ones not worth reporting. */
function leftovers(tokens: readonly string[], hits: readonly Hit[]): readonly string[] {
  const covered = new Set<number>()
  for (const hit of hits) {
    for (let i = hit.from; i < hit.from + hit.length; i += 1) covered.add(i)
  }
  const out: string[] = []
  for (const [index, token] of tokens.entries()) {
    if (covered.has(index) || STOPWORDS.has(token) || token.length < 2) continue
    if (/^\p{N}+$/u.test(token) || out.includes(token)) continue
    out.push(token)
  }
  return out
}

function unique(phrases: readonly string[]): readonly string[] {
  return [...new Set(phrases)]
}

/**
 * A character from a description, plus an honest account of what was read.
 *
 * Never throws: a description is user input, and the panel has to be able to
 * show something for every keystroke on the way to a sentence.
 */
export function describeToConfig(text: string): DescribeResult {
  const tokens = tokenise(text)
  const hits = scan(tokens)
  const matched = unique(hits.map((hit) => hit.phrase))
  const ignored = leftovers(tokens, hits)
  try {
    return { config: normaliseConfig(merge(hits)), matched, ignored }
  } catch {
    // A vocabulary row that the studio rejects is a bug in the table, not in
    // the sentence; show the plain character rather than an error.
    return { config: normaliseConfig({}), matched, ignored }
  }
}
