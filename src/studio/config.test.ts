import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, normaliseConfig } from './config'

describe('normaliseConfig', () => {
  it('fills defaults for an empty partial', () => {
    expect(normaliseConfig({})).toEqual(DEFAULT_CONFIG)
  })

  it('expands #rgb and lowercases colours', () => {
    const c = normaliseConfig({ skin: '#ABC', shirt: '#FF8800' })
    expect(c.skin).toBe('#aabbcc')
    expect(c.shirt).toBe('#ff8800')
  })

  it('rejects malformed colours with RangeError', () => {
    expect(() => normaliseConfig({ skin: 'red' })).toThrow(RangeError)
    expect(() => normaliseConfig({ outline: '#12' })).toThrow(RangeError)
    expect(() => normaliseConfig({ accent: '#gggggg' })).toThrow(RangeError)
  })

  it('rejects unknown enum values with RangeError', () => {
    expect(() => normaliseConfig({ hairStyle: 'mohawk' as never })).toThrow(RangeError)
    expect(() => normaliseConfig({ faceShape: 'cube' as never })).toThrow(RangeError)
    expect(() => normaliseConfig({ headwear: 'crown' as never })).toThrow(RangeError)
  })

  it('rejects unknown keys and wrong value types', () => {
    expect(() => normaliseConfig({ nonsense: 1 } as never)).toThrow(RangeError)
    expect(() => normaliseConfig({ blush: 'yes' } as never)).toThrow(RangeError)
    expect(() => normaliseConfig(null as never)).toThrow(RangeError)
  })

  it('treats undefined values as absent', () => {
    expect(normaliseConfig({ skin: undefined }).skin).toBe(DEFAULT_CONFIG.skin)
  })

  it('derives cheek fluff from the ear type unless set', () => {
    expect(normaliseConfig({ ears: 'fox' }).cheekFluff).toBe('ruff')
    expect(normaliseConfig({ ears: 'cat' }).cheekFluff).toBe('fluff')
    expect(normaliseConfig({ ears: 'bear' }).cheekFluff).toBe('none')
    expect(normaliseConfig({ ears: 'fox', cheekFluff: 'none' }).cheekFluff).toBe('none')
  })

  it('accepts a null or colour facialHairColor', () => {
    expect(normaliseConfig({ facialHairColor: null }).facialHairColor).toBeNull()
    expect(normaliseConfig({ facialHairColor: '#554433' }).facialHairColor).toBe('#554433')
  })

  it('defaults every shading dial to on so existing configs gain the new rendering', () => {
    const c = normaliseConfig({})
    expect(c.material).toBe('auto')
    expect([c.shading, c.rimLight, c.lineTint, c.edgeTexture]).toEqual([1, 1, 1, 1])
  })

  it('accepts dial values inside their range, including zero', () => {
    const c = normaliseConfig({ shading: 0, rimLight: 1.5, lineTint: 0.5, edgeTexture: 1.2 })
    expect([c.shading, c.rimLight, c.lineTint, c.edgeTexture]).toEqual([0, 1.5, 0.5, 1.2])
  })

  it('rejects dial values that are negative, over the maximum or not numbers', () => {
    expect(() => normaliseConfig({ shading: -0.1 })).toThrow(RangeError)
    expect(() => normaliseConfig({ shading: 2 })).toThrow(RangeError)
    expect(() => normaliseConfig({ lineTint: 1.5 })).toThrow(RangeError)
    expect(() => normaliseConfig({ edgeTexture: NaN })).toThrow(RangeError)
    expect(() => normaliseConfig({ rimLight: '1' as never })).toThrow(RangeError)
  })

  it('rejects an unknown material', () => {
    expect(() => normaliseConfig({ material: 'glass' as never })).toThrow(RangeError)
  })

  it('is idempotent', () => {
    const once = normaliseConfig({ ears: 'fox', skin: '#F08A3C' })
    expect(normaliseConfig(once)).toEqual(once)
  })

  it('returns a frozen object so callers cannot mutate shared config', () => {
    expect(Object.isFrozen(normaliseConfig({}))).toBe(true)
  })
})
