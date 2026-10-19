/**
 * Tokenising, and the three small word lists the parser needs: the words that
 * mean "not this", the filler a negation may reach across, and the words that
 * are too ordinary to be worth admitting we ignored.
 */

/** Longer than any description anyone types on purpose; stops a pasted essay from being parsed. */
export const MAX_CHARS = 600
export const MAX_TOKENS = 120

/** "no glasses", "without a hat". */
export const NEGATORS: ReadonlySet<string> = new Set([
  'no', 'not', 'without', 'non', 'none', 'nor', 'sans', 'minus', 'never', 'lacking',
])

/** Words a negation may reach across to find the thing being negated. */
export const FILLER: ReadonlySet<string> = new Set([
  'a', 'an', 'the', 'any', 'with', 'wearing', 'wears', 'wear', 'has', 'have', 'got', 'in', 'of', 'at', 'really',
])

/**
 * Words we are not going to pretend we failed on.
 *
 * The honesty the panel promises is about nouns and adjectives: telling someone
 * we did not understand "the" would be noise, not candour.
 */
export const STOPWORDS: ReadonlySet<string> = new Set([
  ...FILLER,
  ...NEGATORS,
  'and', 'or', 'but', 'also', 'plus', 'is', 'are', 'was', 'be', 'it', 'its', 'their', 'theirs', 'they', 'them',
  'he', 'him', 'his', 'she', 'her', 'hers', 'my', 'me', 'mine', 'i', 'you', 'your', 'who', 'that', 'this',
  'these', 'those', 'some', 'very', 'quite', 'bit', 'kind', 'sort', 'like', 'looks', 'look', 'looking',
  'mascot', 'character', 'avatar', 'logo', 'picture', 'image', 'please', 'make', 'give', 'want', 'wants',
  'short', 'long', 'medium', 'big', 'small', 'little', 'tiny', 'nice', 'cute', 'friendly', 'on', 'to', 'for',
  'from', 'as', 'all', 'one', 'two', 'actually', 'maybe', 'just', 'style', 'coloured', 'colored', 'colour',
])

/**
 * Words, lowercased, with punctuation and apostrophes dropped.
 *
 * Apostrophes go before the split rather than after, so "chef's hat" becomes
 * one phrase the table can hold instead of three words it cannot.
 */
export function tokenise(text: string): readonly string[] {
  const cleaned = text.slice(0, MAX_CHARS).toLowerCase().replace(/['‘’]/g, '')
  return cleaned
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 0)
    .slice(0, MAX_TOKENS)
}
