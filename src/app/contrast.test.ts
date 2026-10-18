import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { contrastRatio, luminance, parseTokens, readThemes, ruleBody } from './contrast'

const css = readFileSync(fileURLToPath(new URL('./styles/tokens.css', import.meta.url)), 'utf8')
const themes = readThemes(css)

/** Body text and anything smaller than 24px / 18.66px bold. */
const TEXT_MIN = 4.5
/** Large text, component boundaries and other non-text UI. */
const UI_MIN = 3

interface Pair {
  readonly front: string
  readonly back: string
  readonly min: number
  readonly why: string
}

const PAIRS: readonly Pair[] = [
  { front: 'ink', back: 'bench', min: TEXT_MIN, why: 'body copy on the page' },
  { front: 'ink', back: 'sheet', min: TEXT_MIN, why: 'body copy on a card' },
  { front: 'ink', back: 'sheet-sunk', min: TEXT_MIN, why: 'text inside a field' },
  { front: 'ink-soft', back: 'bench', min: TEXT_MIN, why: 'secondary copy on the page' },
  { front: 'ink-soft', back: 'sheet', min: TEXT_MIN, why: 'secondary copy on a card' },
  { front: 'ink-soft', back: 'sheet-sunk', min: TEXT_MIN, why: 'hint text inside a field' },
  { front: 'paint-ink', back: 'paint', min: TEXT_MIN, why: 'label on the primary button' },
  { front: 'key-ink', back: 'key', min: TEXT_MIN, why: 'label on the live chip' },
  { front: 'paint', back: 'sheet', min: TEXT_MIN, why: 'the action colour used as text' },
  { front: 'paint', back: 'bench', min: TEXT_MIN, why: 'the action colour used as text on the page' },
  { front: 'ink', back: 'paint-quiet', min: TEXT_MIN, why: 'text on the quiet action tint' },
  { front: 'good', back: 'sheet', min: TEXT_MIN, why: 'the success message' },
  { front: 'bad', back: 'sheet', min: TEXT_MIN, why: 'the failure message' },
  { front: 'line', back: 'sheet', min: UI_MIN, why: 'the ink frame around a card' },
  { front: 'line', back: 'bench', min: UI_MIN, why: 'the ink frame against the page' },
  { front: 'focus', back: 'bench', min: UI_MIN, why: 'the focus ring on the page' },
  { front: 'focus', back: 'sheet', min: UI_MIN, why: 'the focus ring on a card' },
  { front: 'focus', back: 'sheet-sunk', min: UI_MIN, why: 'the focus ring on a field' },
]

describe('luminance', () => {
  it('puts black at 0 and white at 1', () => {
    expect(luminance('#000000')).toBeCloseTo(0, 6)
    expect(luminance('#ffffff')).toBeCloseTo(1, 6)
  })

  it('rejects anything that is not a 6-digit hex colour', () => {
    expect(() => luminance('#fff')).toThrow(/6-digit/)
    expect(() => luminance('rebeccapurple')).toThrow(/6-digit/)
  })

  it('ignores surrounding whitespace', () => {
    expect(luminance('  #ffffff ')).toBeCloseTo(1, 6)
  })
})

describe('contrastRatio', () => {
  it('reports 21 for black against white, either way round', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 4)
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 4)
  })

  it('reports 1 for a colour against itself', () => {
    expect(contrastRatio('#9e1d45', '#9e1d45')).toBeCloseTo(1, 6)
  })
})

describe('parseTokens', () => {
  it('collects hex custom properties and skips everything else', () => {
    const block = '--a: #ff0000;\n--b: 4px;\n--c: #00ff00;\ncolor-scheme: light;'
    expect(parseTokens(block)).toEqual({ a: '#ff0000', c: '#00ff00' })
  })
})

describe('ruleBody', () => {
  it('throws with the selector named when the rule is missing', () => {
    expect(() => ruleBody(css, '.no-such-selector')).toThrow(/no-such-selector/)
  })
})

describe('tokens.css', () => {
  it('declares both themes', () => {
    expect(Object.keys(themes.light).length).toBeGreaterThan(10)
    expect(Object.keys(themes.dark).length).toBeGreaterThan(10)
  })

  it('keeps the media-query dark block and the data-theme dark block identical', () => {
    expect(themes.darkBlocksAgree).toBe(true)
  })

  it('defines every token the light theme defines in the dark theme too', () => {
    expect(Object.keys(themes.dark).sort()).toEqual(Object.keys(themes.light).sort())
  })

  it.each(PAIRS)('light: --$front on --$back clears $min:1 ($why)', ({ front, back, min }) => {
    const a = themes.light[front]
    const b = themes.light[back]
    expect(a, `--${front} is missing`).toBeDefined()
    expect(b, `--${back} is missing`).toBeDefined()
    expect(contrastRatio(a as string, b as string)).toBeGreaterThanOrEqual(min)
  })

  it.each(PAIRS)('dark: --$front on --$back clears $min:1 ($why)', ({ front, back, min }) => {
    const a = themes.dark[front]
    const b = themes.dark[back]
    expect(a, `--${front} is missing`).toBeDefined()
    expect(b, `--${back} is missing`).toBeDefined()
    expect(contrastRatio(a as string, b as string)).toBeGreaterThanOrEqual(min)
  })

  it('keeps the two checkerboard squares distinguishable from each other', () => {
    const light = contrastRatio(themes.light['checker-a'] as string, themes.light['checker-b'] as string)
    const dark = contrastRatio(themes.dark['checker-a'] as string, themes.dark['checker-b'] as string)
    expect(light).toBeGreaterThan(1.1)
    expect(dark).toBeGreaterThan(1.1)
  })
})
