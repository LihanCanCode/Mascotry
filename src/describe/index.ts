/**
 * "Describe it": a character from a sentence, with no model, no network and no
 * guessing. See ./parse for how the reading works.
 */
export { describeToConfig } from './parse'
export { EXAMPLE_DESCRIPTIONS, drawExample, shuffle } from './examples'
export { NAMED_COLOURS } from './colours'
export { PHRASE_COUNT } from './vocab'
export { MAX_CHARS } from './words'
export type { DescribeResult, ColourSlot, VocabEntry } from './types'
