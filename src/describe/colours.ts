/**
 * The colour half of the description vocabulary.
 *
 * Two things live here: a table of ordinary colour words, and the arithmetic
 * that lets a modifier in front of one of them ("dark green", "very pale
 * blue") mean something. Keeping the arithmetic here rather than in the table
 * is what makes the table small: forty colour words and seven modifiers cover
 * a few hundred phrases, and every one of them comes out as a `#rrggbb` the
 * studio will accept.
 */

/** A `#rrggbb` string, which is the only colour form `normaliseConfig` takes. */
export type Hex = string

const CHANNELS = 3
const FULL = 255

function clamp(value: number): number {
  return Math.min(FULL, Math.max(0, Math.round(value)))
}

export function toHex(rgb: readonly number[]): Hex {
  return `#${rgb.slice(0, CHANNELS).map((c) => clamp(c).toString(16).padStart(2, '0')).join('')}`
}

export function fromHex(value: Hex): readonly number[] {
  const body = value.slice(1)
  return [0, 1, 2].map((i) => Number.parseInt(body.slice(i * 2, i * 2 + 2), 16))
}

/** `from` moved `amount` of the way toward `to`. */
function mix(from: Hex, to: Hex, amount: number): Hex {
  const a = fromHex(from)
  const b = fromHex(to)
  return toHex(a.map((channel, i) => channel + ((b[i] ?? channel) - channel) * amount))
}

/** Push every channel away from (or toward) the pixel's own mean. */
function saturate(value: Hex, factor: number): Hex {
  const rgb = fromHex(value)
  const mean = rgb.reduce((sum, c) => sum + c, 0) / CHANNELS
  return toHex(rgb.map((c) => mean + (c - mean) * factor))
}

const BLACK = '#000000'
const WHITE = '#ffffff'

type Shift = (value: Hex, strength: number) => Hex

/**
 * The words that can sit in front of a colour. `very` is not one of them: it
 * multiplies whatever follows, which is why the strength is a parameter.
 */
const SHIFTS: ReadonlyMap<string, Shift> = new Map<string, Shift>([
  ['dark', (v, s) => mix(v, BLACK, Math.min(0.85, 0.35 * s))],
  ['deep', (v, s) => mix(v, BLACK, Math.min(0.85, 0.3 * s))],
  ['darker', (v, s) => mix(v, BLACK, Math.min(0.85, 0.5 * s))],
  ['light', (v, s) => mix(v, WHITE, Math.min(0.85, 0.35 * s))],
  ['pale', (v, s) => mix(v, WHITE, Math.min(0.85, 0.5 * s))],
  ['soft', (v, s) => mix(v, WHITE, Math.min(0.85, 0.25 * s))],
  ['bright', (v, s) => saturate(v, 1 + 0.35 * s)],
  ['vivid', (v, s) => saturate(v, 1 + 0.5 * s)],
  ['muted', (v, s) => saturate(v, Math.max(0.1, 1 - 0.55 * s))],
  ['dull', (v, s) => saturate(v, Math.max(0.1, 1 - 0.55 * s))],
  ['faded', (v, s) => mix(saturate(v, 0.6), WHITE, Math.min(0.6, 0.2 * s))],
])

/** Words that only strengthen the modifier after them. */
const INTENSIFIERS: ReadonlySet<string> = new Set(['very', 'really', 'super', 'extremely'])

/** Ordinary colour words. Deliberately plain: this is a crayon box, not a paint catalogue. */
export const NAMED_COLOURS: ReadonlyMap<string, Hex> = new Map<string, Hex>([
  ['red', '#d23b3b'], ['crimson', '#c2173b'], ['scarlet', '#e02b1f'], ['maroon', '#6e2130'],
  ['burgundy', '#5e1f33'], ['orange', '#ec7a2a'], ['amber', '#f0a62b'], ['coral', '#f08a72'],
  ['salmon', '#f09a8a'], ['peach', '#f6c3a0'], ['yellow', '#f2cf3c'], ['gold', '#e0b23a'],
  ['mustard', '#d4a52a'], ['cream', '#f6ecd8'], ['ivory', '#f4efe2'], ['beige', '#ddc7a8'],
  ['sand', '#e4cfa4'], ['khaki', '#b6a86e'], ['olive', '#7a7a3c'], ['lime', '#8cc63f'],
  ['green', '#3f9e5a'], ['emerald', '#2f9e74'], ['mint', '#9fd9bd'], ['teal', '#2f8f8f'],
  ['turquoise', '#3fc0b0'], ['cyan', '#39b6c8'], ['blue', '#3f6fb5'], ['navy', '#22365e'],
  ['indigo', '#4a3f9e'], ['violet', '#7a4fb5'], ['purple', '#8a46a8'], ['lavender', '#bfa8e0'],
  ['plum', '#6e3a5e'], ['magenta', '#c63f9e'], ['pink', '#f07aa0'], ['rose', '#e06b85'],
  ['brown', '#8a5a3c'], ['chocolate', '#5e3a28'], ['chestnut', '#5e3a24'], ['tan', '#c99a6e'],
  ['bronze', '#b0703f'], ['grey', '#9aa0a8'], ['gray', '#9aa0a8'], ['silver', '#c3c9d0'],
  ['charcoal', '#3b3f48'], ['slate', '#5a6472'], ['black', '#22232a'], ['white', '#f7f4fa'],
])

/**
 * One colour from a run of words, or null when the run is not a colour.
 *
 * The last word has to be a colour name and everything in front of it has to
 * be a modifier, which is what keeps "green jumper" from being read as a
 * colour and "dark green" from being read as two.
 */
export function compoundColour(words: readonly string[]): Hex | null {
  const last = words[words.length - 1]
  if (last === undefined) return null
  const base = NAMED_COLOURS.get(last)
  if (base === undefined) return null
  const front = words.slice(0, -1)
  if (front.length === 0) return base
  let strength = 1
  let result = base
  // Left to right, so "very" is already in hand when "dark" is applied.
  for (const word of front) {
    const shift = SHIFTS.get(word)
    if (shift !== undefined) {
      result = shift(result, strength)
      strength = 1
      continue
    }
    if (!INTENSIFIERS.has(word)) return null
    strength *= 1.6
  }
  return result
}

/** True when a word could only ever be part of a colour phrase. */
export function isColourWord(word: string): boolean {
  return NAMED_COLOURS.has(word) || SHIFTS.has(word) || INTENSIFIERS.has(word)
}
