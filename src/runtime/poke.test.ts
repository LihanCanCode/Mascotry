import { describe, expect, it } from 'vitest'
import {
  DIZZY_CELL,
  DIZZY_HOLD_MS,
  HOLD_MS,
  INITIAL_POKE,
  MOODS,
  poke,
  STREAK_FOR_DIZZY,
  STREAK_GAP_MS,
} from './poke'

const first = (): number => 0

describe('poke', () => {
  it('shows a reaction and holds it', () => {
    const result = poke(INITIAL_POKE, 1000, first)
    expect(result.cell).toBeGreaterThanOrEqual(0)
    expect(result.cell).toBeLessThan(MOODS.length)
    expect(result.hold).toBe(HOLD_MS)
  })

  it('never draws dizzy from the bag', () => {
    let state = INITIAL_POKE
    let now = 0
    const seen: number[] = []
    for (let i = 0; i < 8; i++) {
      now += STREAK_GAP_MS + 1 // slow pokes, so no streak
      const result = poke(state, now, first)
      state = result.state
      seen.push(result.cell)
    }
    expect(seen).not.toContain(DIZZY_CELL)
  })

  it('shows every other mood before repeating one', () => {
    let state = INITIAL_POKE
    let now = 0
    const seen: number[] = []
    for (let i = 0; i < MOODS.length - 1; i++) {
      now += STREAK_GAP_MS + 1
      const result = poke(state, now, first)
      state = result.state
      seen.push(result.cell)
    }
    expect(new Set(seen).size).toBe(seen.length)
  })

  it('refills the bag once it runs out', () => {
    let state = INITIAL_POKE
    let now = 0
    for (let i = 0; i < MOODS.length * 2; i++) {
      now += STREAK_GAP_MS + 1
      const result = poke(state, now, first)
      state = result.state
      expect(result.cell).toBeGreaterThanOrEqual(0)
    }
  })

  it('goes dizzy after enough pokes in quick succession', () => {
    let state = INITIAL_POKE
    let now = 1000
    let last = poke(state, now, first)
    state = last.state
    for (let i = 1; i < STREAK_FOR_DIZZY; i++) {
      now += 100
      last = poke(state, now, first)
      state = last.state
    }
    expect(last.cell).toBe(DIZZY_CELL)
    expect(last.hold).toBe(DIZZY_HOLD_MS)
  })

  it('resets the streak after a pause', () => {
    let state = INITIAL_POKE
    let now = 1000
    for (let i = 0; i < STREAK_FOR_DIZZY - 1; i++) {
      const result = poke(state, now, first)
      state = result.state
      now += 100
    }
    now += STREAK_GAP_MS + 1
    const afterPause = poke(state, now, first)
    expect(afterPause.cell).not.toBe(DIZZY_CELL)
    expect(afterPause.state.streak).toBe(1)
  })

  it('clears the streak once it has paid off', () => {
    let state = INITIAL_POKE
    let now = 0
    let result = poke(state, now, first)
    for (let i = 1; i < STREAK_FOR_DIZZY; i++) {
      now += 100
      result = poke(result.state, now, first)
    }
    expect(result.state.streak).toBe(0)
  })

  it('survives a picker that returns nonsense', () => {
    for (const bad of [-5, 99, Number.NaN, 1.7]) {
      const result = poke(INITIAL_POKE, 0, () => bad)
      expect(result.cell).toBeGreaterThanOrEqual(0)
      expect(result.cell).toBeLessThan(MOODS.length)
    }
  })
})
