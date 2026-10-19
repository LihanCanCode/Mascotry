import { describe, expect, it } from 'vitest'
import { hexToRgb, inkOf } from './draw'
import { materialOf } from './rig'
import { bounceOf, formPaint, rimOf, rgba } from './shade'
import { normaliseConfig } from './config'
import { nodeCanvasFactory } from './testCanvas'
import type { Ctx } from './types'

const luma = (hex: string): number => {
  const [r, g, b] = hexToRgb(hex)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
/** Hue in degrees, or null for a colour too grey to have a meaningful one. */
const hue = (hex: string): number | null => {
  const [r, g, b] = hexToRgb(hex)
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
  if (mx - mn < 8) return null
  const d = mx - mn
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4
  return ((h * 60) % 360 + 360) % 360
}

const ctx = (): Ctx => {
  const c = nodeCanvasFactory(8, 8).getContext('2d')
  if (!c) throw new Error('no context')
  return c
}

describe('inkOf', () => {
  it('returns the global outline when the tint is off', () => {
    expect(inkOf('#f08a3c', '#2b1d33', 0)).toBe('#2b1d33')
  })

  it('gives an orange fill a warm line and a blue fill a cool one', () => {
    const warm = hue(inkOf('#f08a3c', '#2b1d33', 1))
    const cool = hue(inkOf('#3f6fb5', '#2b1d33', 1))
    expect(warm).not.toBeNull()
    expect(cool).not.toBeNull()
    expect(warm as number).toBeLessThan(60)
    expect(cool as number).toBeGreaterThan(180)
  })

  it('always lands far darker than the colour it encloses', () => {
    for (const fill of ['#f08a3c', '#ffffff', '#b9b4c9', '#5fa886', '#180f14']) {
      expect(luma(inkOf(fill, '#2b1d33', 1))).toBeLessThan(Math.max(luma(fill) * 0.6, 60))
    }
  })

  it('blends toward the global outline at partial tint', () => {
    const full = inkOf('#f08a3c', '#2b1d33', 1)
    const part = inkOf('#f08a3c', '#2b1d33', 0.5)
    expect(part).not.toBe(full)
    expect(part).not.toBe('#2b1d33')
  })
})

describe('bounceOf', () => {
  it('warms a saturated base and cools a metal one', () => {
    const warm = hue(bounceOf('#a8714a', 'fur', 1))
    const cold = hue(bounceOf('#5a7a9a', 'metal', 1))
    expect(warm as number).toBeLessThan(45)
    expect(cold as number).toBeGreaterThan(180)
  })

  it('tints a near-grey toward a fixed hue instead of amplifying rounding noise', () => {
    const grey = bounceOf('#b0b0b2', 'fur', 1)
    expect(hue(grey)).not.toBeNull()
    expect(hue(grey) as number).toBeLessThan(60)
  })

  it('collapses toward the plain shade when the dial is off', () => {
    expect(luma(bounceOf('#a8714a', 'fur', 0))).toBeCloseTo(luma('#a8714a'), 0)
  })
})

describe('rimOf', () => {
  it('is brighter than the base for every material', () => {
    for (const mat of ['fur', 'skin', 'cloth', 'metal'] as const) {
      expect(luma(rimOf('#a8714a', mat))).toBeGreaterThan(luma('#a8714a'))
    }
  })
})

describe('rgba', () => {
  it('formats a hex colour with an alpha and clamps out of range values', () => {
    expect(rgba('#ff8000', 0.5)).toBe('rgba(255,128,0,0.500)')
    expect(rgba('#000000', 5)).toBe('rgba(0,0,0,1.000)')
    expect(rgba('#000000', -1)).toBe('rgba(0,0,0,0.000)')
  })
})

describe('formPaint', () => {
  const box = { x0: 0, y0: 0, x1: 100, y1: 100 }

  it('returns the flat base colour when shading is off', () => {
    expect(formPaint(ctx(), box, { base: '#a8714a', mat: 'fur', k: 0 })).toBe('#a8714a')
  })

  it('returns a gradient once shading is on', () => {
    const paint = formPaint(ctx(), box, { base: '#a8714a', mat: 'fur', k: 1 })
    expect(typeof paint).not.toBe('string')
  })

  it('survives a degenerate box', () => {
    const paint = formPaint(ctx(), { x0: 5, y0: 5, x1: 5, y1: 5 }, { base: '#a8714a', mat: 'skin', k: 1 })
    expect(typeof paint).not.toBe('string')
  })
})

describe('materialOf', () => {
  it('reads bolt ears as metal, animal ears as fur and anything else as skin', () => {
    expect(materialOf(normaliseConfig({ ears: 'bolt' }))).toBe('metal')
    expect(materialOf(normaliseConfig({ ears: 'fox' }))).toBe('fur')
    expect(materialOf(normaliseConfig({ ears: 'human' }))).toBe('skin')
  })

  it('lets an explicit choice win over the automatic one', () => {
    expect(materialOf(normaliseConfig({ ears: 'fox', material: 'metal' }))).toBe('metal')
  })
})
