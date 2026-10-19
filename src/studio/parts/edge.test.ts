import { describe, expect, it } from 'vitest'
import { normaliseConfig } from '../config'
import { beardRipple, edgeSeed, furRipple, hairWobble } from './edge'

const cfg = (over = {}) => normaliseConfig({ ears: 'fox', skin: '#f08a3c', ...over })
const SAMPLES = Array.from({ length: 64 }, (_, i) => (i / 64) * Math.PI * 2)

describe('furRipple', () => {
  it('is symmetric about the vertical axis so the centred cell stays symmetric', () => {
    const f = furRipple(cfg(), true)
    for (const t of SAMPLES) expect(f(Math.PI - t)).toBeCloseTo(f(t), 10)
  })

  it('is deterministic for the same config and differs for a different one', () => {
    const a = furRipple(cfg(), true), b = furRipple(cfg(), true)
    const c = furRipple(cfg({ skin: '#3366aa' }), true)
    expect(SAMPLES.map(a)).toEqual(SAMPLES.map(b))
    expect(SAMPLES.map(a)).not.toEqual(SAMPLES.map(c))
  })

  it('fades to nothing at the chin so the body band is never disturbed', () => {
    const f = furRipple(cfg(), true)
    expect(f(Math.PI / 2)).toBeCloseTo(0, 10)
  })

  it('stays small enough to texture an outline rather than deform it', () => {
    const f = furRipple(cfg(), true)
    for (const t of SAMPLES) expect(Math.abs(f(t))).toBeLessThan(0.04)
  })

  it('is flat for non-fur characters and when the dial is off', () => {
    expect(SAMPLES.map(furRipple(cfg(), false))).toEqual(SAMPLES.map(() => 0))
    expect(SAMPLES.map(furRipple(cfg({ edgeTexture: 0 }), true))).toEqual(SAMPLES.map(() => 0))
  })

  it('scales with the edgeTexture dial', () => {
    const one = furRipple(cfg(), true), half = furRipple(cfg({ edgeTexture: 0.5 }), true)
    for (const t of SAMPLES) expect(half(t)).toBeCloseTo(one(t) / 2, 10)
  })
})

describe('beardRipple', () => {
  const person = (over = {}) => normaliseConfig({ ears: 'human', facialHair: 'beard', ...over })
  const JAW = Array.from({ length: 48 }, (_, i) => 0.3 + (i / 47) * (Math.PI - 0.6))

  it('is symmetric about the vertical axis so the centred cell stays symmetric', () => {
    const f = beardRipple(person())
    for (const t of JAW) expect(f(Math.PI - t)).toBeCloseTo(f(t), 10)
  })

  it('is deterministic for the same config and differs for a different one', () => {
    expect(JAW.map(beardRipple(person()))).toEqual(JAW.map(beardRipple(person())))
    expect(JAW.map(beardRipple(person()))).not.toEqual(JAW.map(beardRipple(person({ faceShape: 'oval' }))))
  })

  it('fades to nothing at the chin, which is what keeps it clear of the body band', () => {
    expect(beardRipple(person())(Math.PI / 2)).toBeCloseTo(0, 10)
  })

  it('stays small enough to clump an outline rather than deform it', () => {
    const f = beardRipple(person())
    for (const t of JAW) expect(Math.abs(f(t))).toBeLessThan(0.09)
  })

  it('scales with the edgeTexture dial and switches off at zero', () => {
    const one = beardRipple(person()), half = beardRipple(person({ edgeTexture: 0.5 }))
    for (const t of JAW) expect(half(t)).toBeCloseTo(one(t) / 2, 10)
    expect(JAW.map(beardRipple(person({ edgeTexture: 0 })))).toEqual(JAW.map(() => 0))
  })
})

describe('edgeSeed', () => {
  it('depends on the look, not on unrelated colours', () => {
    expect(edgeSeed(cfg())).toBe(edgeSeed(cfg({ shirt: '#123456' })))
    expect(edgeSeed(cfg())).not.toBe(edgeSeed(cfg({ faceShape: 'square' })))
  })
})

describe('hairWobble', () => {
  it('returns one amplitude per arc sample', () => {
    expect(hairWobble(14, 7, 0.02)).toHaveLength(15)
  })

  it('is a palindrome, which is what keeps the hair silhouette symmetric', () => {
    const w = hairWobble(16, 99, 0.05)
    expect(w).toEqual([...w].reverse())
  })

  it('stays within the requested amplitude and is deterministic', () => {
    const w = hairWobble(14, 7, 0.02)
    expect(w).toEqual(hairWobble(14, 7, 0.02))
    for (const v of w) expect(v).toBeGreaterThanOrEqual(0)
    for (const v of w) expect(v).toBeLessThanOrEqual(0.02)
  })

  it('collapses to zero amplitude when asked for none', () => {
    expect(hairWobble(10, 3, 0)).toEqual(new Array(11).fill(0))
  })
})
