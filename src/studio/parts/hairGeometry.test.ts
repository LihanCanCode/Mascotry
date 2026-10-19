import { describe, expect, it } from 'vitest'
import { hairWobble } from './edge'
import { linePhi, wobbleLine } from './hairGeometry'
import type { SpherePt } from '../types'

/** A hairline laid out symmetrically in longitude, as every cap's line is. */
const LINE: readonly SpherePt[] = [[1.2, 0.3], [0.6, 0.6], [0, 0.7], [-0.6, 0.6], [-1.2, 0.3]]

describe('wobbleLine', () => {
  it('keeps one point per input point, at the same longitude', () => {
    const out = wobbleLine(LINE, hairWobble(LINE.length - 1, 5, 0.06))
    expect(out).toHaveLength(LINE.length)
    expect(out.map((p) => p[0])).toEqual(LINE.map((p) => p[0]))
  })

  it('only ever lowers a hairline, so the cap never uncovers what it covered', () => {
    const out = wobbleLine(LINE, hairWobble(LINE.length - 1, 5, 0.06))
    out.forEach((p, i) => {
      expect(p[1]).toBeLessThanOrEqual((LINE[i] as SpherePt)[1])
      expect(p[1]).toBeGreaterThanOrEqual((LINE[i] as SpherePt)[1] - 0.06)
    })
  })

  it('stays mirror-symmetric, because the wobble it is given is a palindrome', () => {
    const out = wobbleLine(LINE, hairWobble(LINE.length - 1, 5, 0.06))
    for (let i = 0; i < out.length; i++) {
      const mirror = out[out.length - 1 - i] as SpherePt
      expect((out[i] as SpherePt)[1]).toBeCloseTo(mirror[1], 12)
    }
  })

  it('leaves the line untouched when the wobble is empty', () => {
    expect(wobbleLine(LINE, []).map(([t, p]) => [t, p])).toEqual(LINE.map(([t, p]) => [t, p]))
  })
})

describe('linePhi', () => {
  it('interpolates between the two points a longitude falls between', () => {
    expect(linePhi(LINE, 0.3)).toBeCloseTo(0.65, 10)
  })

  it('clamps to the end points outside the line', () => {
    expect(linePhi(LINE, 3)).toBeCloseTo(0.3, 10)
    expect(linePhi(LINE, -3)).toBeCloseTo(0.3, 10)
  })
})
