import { describe, expect, it } from 'vitest'
import { EXAMPLE_DESCRIPTIONS, drawExample, shuffle } from './examples'
import { describeToConfig } from './parse'
import { MAX_CHARS } from './words'

/** A predictable stand-in for Math.random, so a shuffle can be asserted at all. */
function sequence(values: readonly number[]): () => number {
  let index = 0
  return () => values[index++ % values.length] ?? 0
}

describe('the example bag', () => {
  it('offers more than a handful of examples', () => {
    expect(EXAMPLE_DESCRIPTIONS.length).toBeGreaterThanOrEqual(12)
  })

  it('every example is understood by the parser it feeds', () => {
    for (const text of EXAMPLE_DESCRIPTIONS) {
      const result = describeToConfig(text)
      expect(result.matched.length, text).toBeGreaterThanOrEqual(2)
    }
  })

  it('keeps every example short enough to be read whole', () => {
    for (const text of EXAMPLE_DESCRIPTIONS) {
      expect(text.length).toBeLessThan(MAX_CHARS)
    }
  })
})

describe('shuffle', () => {
  it('keeps every item exactly once', () => {
    const out = shuffle([1, 2, 3, 4, 5], sequence([0.1, 0.9, 0.5, 0.3]))
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5])
  })

  it('leaves the original list alone', () => {
    const source = Object.freeze([1, 2, 3])
    expect(() => shuffle(source, sequence([0.5]))).not.toThrow()
    expect(source).toEqual([1, 2, 3])
  })

  it('does reorder, given a random that says so', () => {
    expect(shuffle([1, 2, 3, 4], sequence([0]))).not.toEqual([1, 2, 3, 4])
  })

  it('handles an empty list', () => {
    expect(shuffle([])).toEqual([])
  })
})

describe('drawExample', () => {
  it('takes the first of the bag and hands back the rest', () => {
    const result = drawExample(['one', 'two', 'three'])
    expect(result.text).toBe('one')
    expect(result.rest).toEqual(['two', 'three'])
  })

  it('refills an empty bag rather than running out', () => {
    const result = drawExample([], sequence([0.4, 0.7, 0.2]))
    expect(EXAMPLE_DESCRIPTIONS).toContain(result.text)
    expect(result.rest.length).toBe(EXAMPLE_DESCRIPTIONS.length - 1)
  })

  it('works its way through the whole bag without repeating', () => {
    let bag: readonly string[] = EXAMPLE_DESCRIPTIONS
    const seen: string[] = []
    for (let i = 0; i < EXAMPLE_DESCRIPTIONS.length; i += 1) {
      const drawn = drawExample(bag)
      seen.push(drawn.text)
      bag = drawn.rest
    }
    expect(new Set(seen).size).toBe(EXAMPLE_DESCRIPTIONS.length)
  })
})
