import { describe, expect, it } from 'vitest'
import { NAMED_COLOURS, compoundColour, fromHex, isColourWord, toHex } from './colours'

/** Perceived brightness, enough to say whether a modifier darkened or lightened. */
function level(hex: string): number {
  const [r = 0, g = 0, b = 0] = fromHex(hex)
  return 0.299 * r + 0.587 * g + 0.114 * b
}

/** How far the channels sit from their own mean: a stand-in for saturation. */
function vividness(hex: string): number {
  const rgb = fromHex(hex)
  const mean = rgb.reduce((sum, c) => sum + c, 0) / rgb.length
  return rgb.reduce((sum, c) => sum + Math.abs(c - mean), 0)
}

const GREEN = NAMED_COLOURS.get('green') ?? '#000000'

describe('the colour table', () => {
  it('holds every colour word as a six-digit hex', () => {
    for (const [name, hex] of NAMED_COLOURS) {
      expect(hex, name).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it('offers enough words to describe something with', () => {
    expect(NAMED_COLOURS.size).toBeGreaterThanOrEqual(40)
  })

  it('spells grey both ways, and means the same thing by both', () => {
    expect(NAMED_COLOURS.get('grey')).toBe(NAMED_COLOURS.get('gray'))
  })
})

describe('hex conversion', () => {
  it('round-trips a colour', () => {
    expect(toHex(fromHex('#3f6fb5'))).toBe('#3f6fb5')
  })

  it('pads a channel that needs it', () => {
    expect(toHex([1, 2, 3])).toBe('#010203')
  })

  it('clamps anything the arithmetic pushed out of range', () => {
    expect(toHex([-40, 300, 128.6])).toBe('#00ff81')
  })
})

describe('compoundColour', () => {
  it('reads a plain colour word', () => {
    expect(compoundColour(['green'])).toBe(GREEN)
  })

  it('refuses a word that is not a colour', () => {
    expect(compoundColour(['jumper'])).toBeNull()
    expect(compoundColour([])).toBeNull()
    expect(compoundColour(['dark', 'jumper'])).toBeNull()
  })

  it('refuses a run whose front words are not modifiers', () => {
    expect(compoundColour(['woolly', 'green'])).toBeNull()
  })

  it.each(['dark', 'deep', 'darker'])('%s makes a colour darker', (word) => {
    expect(level(compoundColour([word, 'green']) ?? '')).toBeLessThan(level(GREEN))
  })

  it.each(['light', 'pale', 'soft'])('%s makes a colour lighter', (word) => {
    expect(level(compoundColour([word, 'green']) ?? '')).toBeGreaterThan(level(GREEN))
  })

  it.each(['bright', 'vivid'])('%s makes a colour stronger', (word) => {
    expect(vividness(compoundColour([word, 'green']) ?? '')).toBeGreaterThan(vividness(GREEN))
  })

  it.each(['muted', 'dull', 'faded'])('%s makes a colour weaker', (word) => {
    expect(vividness(compoundColour([word, 'green']) ?? '')).toBeLessThan(vividness(GREEN))
  })

  it.each(['very', 'really', 'super', 'extremely'])('%s strengthens the modifier after it', (word) => {
    const plain = compoundColour(['dark', 'green']) ?? ''
    const strong = compoundColour([word, 'dark', 'green']) ?? ''
    expect(level(strong)).toBeLessThan(level(plain))
  })

  it('stacks two intensifiers', () => {
    const once = compoundColour(['very', 'dark', 'blue']) ?? ''
    const twice = compoundColour(['very', 'very', 'dark', 'blue']) ?? ''
    expect(level(twice)).toBeLessThan(level(once))
  })

  it('never darkens all the way to black, however hard it is pushed', () => {
    const black = compoundColour(['very', 'very', 'very', 'darker', 'blue']) ?? ''
    expect(level(black)).toBeGreaterThan(0)
  })

  it('applies two different modifiers in turn', () => {
    const both = compoundColour(['dark', 'muted', 'red']) ?? ''
    const dark = compoundColour(['dark', 'red']) ?? ''
    expect(both).not.toBe(dark)
    expect(both).toMatch(/^#[0-9a-f]{6}$/)
  })
})

describe('isColourWord', () => {
  it.each(['green', 'dark', 'very', 'muted'])('%s belongs to a colour phrase', (word) => {
    expect(isColourWord(word)).toBe(true)
  })

  it.each(['jumper', 'beanie', 'llama'])('%s does not', (word) => {
    expect(isColourWord(word)).toBe(false)
  })
})
