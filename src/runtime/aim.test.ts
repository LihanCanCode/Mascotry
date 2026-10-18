import { describe, expect, it } from 'vitest'
import {
  aimCell,
  cellPosition,
  CENTRE_CELL,
  DEFAULT_AIM,
  normaliseSettings,
  quantiseLane,
  type Lane,
} from './aim'

const S = { commit: 40, release: 20 }

describe('normaliseSettings', () => {
  it('falls back to the defaults', () => {
    expect(normaliseSettings()).toEqual(DEFAULT_AIM)
  })

  it('keeps release strictly inside commit', () => {
    expect(normaliseSettings({ commit: 10, release: 50 })).toEqual({ commit: 10, release: 9 })
  })

  it('refuses a zero or negative commit distance', () => {
    expect(normaliseSettings({ commit: 0 }).commit).toBe(1)
    expect(normaliseSettings({ commit: -5 }).commit).toBe(1)
  })

  it('allows a release of zero', () => {
    expect(normaliseSettings({ commit: 30, release: -4 }).release).toBe(0)
  })
})

describe('quantiseLane', () => {
  it('stays centred until the pointer passes the commit distance', () => {
    expect(quantiseLane(39, 1, S)).toBe(1)
    expect(quantiseLane(40, 1, S)).toBe(2)
    expect(quantiseLane(-40, 1, S)).toBe(0)
  })

  it('holds a committed lane until the pointer comes back past release', () => {
    expect(quantiseLane(25, 2, S)).toBe(2)
    expect(quantiseLane(19, 2, S)).toBe(1)
    expect(quantiseLane(-25, 0, S)).toBe(0)
    expect(quantiseLane(-19, 0, S)).toBe(1)
  })

  it('does not flicker in the band between release and commit', () => {
    // Walking outward then back across the same point gives different answers
    // on purpose: that gap is exactly what hysteresis buys.
    expect(quantiseLane(30, 1, S)).toBe(1)
    expect(quantiseLane(30, 2, S)).toBe(2)
  })

  it('can flip straight across the centre when the pointer jumps', () => {
    expect(quantiseLane(-40, 2, S)).toBe(0)
    expect(quantiseLane(40, 0, S)).toBe(2)
  })
})

describe('aimCell', () => {
  it('returns the centre cell when the pointer rests on the mascot', () => {
    expect(aimCell(0, 0, CENTRE_CELL, S)).toBe(CENTRE_CELL)
  })

  it.each([
    ['right', 100, 0, 5],
    ['left', -100, 0, 3],
    ['up', 0, -100, 1],
    ['down', 0, 100, 7],
    ['up-left', -100, -100, 0],
    ['up-right', 100, -100, 2],
    ['down-left', -100, 100, 6],
    ['down-right', 100, 100, 8],
  ])('looks %s', (_name, dx, dy, expected) => {
    expect(aimCell(dx, dy, CENTRE_CELL, S)).toBe(expected)
  })

  it('treats the axes independently', () => {
    // Far right but only slightly above: column commits, row does not.
    expect(aimCell(100, -10, CENTRE_CELL, S)).toBe(5)
  })

  it('recovers from a nonsensical previous cell', () => {
    for (const bad of [-1, 9, 2.5, Number.NaN]) {
      expect(aimCell(0, 0, bad, S)).toBe(CENTRE_CELL)
    }
  })
})

describe('cellPosition', () => {
  it('maps the nine cells onto 0/50/100 percent stops', () => {
    expect(cellPosition(0)).toBe('0% 0%')
    expect(cellPosition(4)).toBe('50% 50%')
    expect(cellPosition(8)).toBe('100% 100%')
    expect(cellPosition(2)).toBe('100% 0%')
    expect(cellPosition(6)).toBe('0% 100%')
  })

  it('falls back to the centre for an out-of-range cell', () => {
    expect(cellPosition(99)).toBe(cellPosition(CENTRE_CELL))
  })
})

describe('lane type coverage', () => {
  it('accepts every lane value', () => {
    const lanes: Lane[] = [0, 1, 2]
    for (const lane of lanes) expect(quantiseLane(0, lane, S)).toBeTypeOf('number')
  })
})
