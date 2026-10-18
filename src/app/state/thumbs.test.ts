import type { Pixels } from '../../image/types'
import { createThumbCache } from './thumbs'

const pixels = (tag: number): Pixels => ({ width: 1, height: 1, data: new Uint8ClampedArray([tag, 0, 0, 255]) })

describe('createThumbCache', () => {
  it('draws on the first ask and hands back the same buffer afterwards', () => {
    const cache = createThumbCache()
    let calls = 0
    const draw = (): Pixels => {
      calls += 1
      return pixels(calls)
    }

    const first = cache.get('fox', draw)
    const second = cache.get('fox', draw)

    expect(calls).toBe(1)
    expect(second).toBe(first)
  })

  it('draws once per id', () => {
    const cache = createThumbCache()
    let calls = 0
    const draw = (): Pixels => {
      calls += 1
      return pixels(calls)
    }

    cache.get('fox', draw)
    cache.get('bear', draw)
    cache.get('fox', draw)

    expect(calls).toBe(2)
    expect(cache.size).toBe(2)
  })

  it('reports what it is already holding', () => {
    const cache = createThumbCache()
    expect(cache.has('fox')).toBe(false)
    cache.get('fox', () => pixels(1))
    expect(cache.has('fox')).toBe(true)
  })

  /**
   * A 512px thumbnail is a megabyte of RGBA, so the cache is bounded. Dropping
   * the oldest entry is the right policy here: the grid is scrolled top to
   * bottom, so the oldest entry is also the one furthest off screen.
   */
  it('drops the oldest entry once it is over its limit', () => {
    const cache = createThumbCache(2)
    cache.get('a', () => pixels(1))
    cache.get('b', () => pixels(2))
    cache.get('c', () => pixels(3))

    expect(cache.size).toBe(2)
    expect(cache.has('a')).toBe(false)
    expect(cache.has('b')).toBe(true)
    expect(cache.has('c')).toBe(true)
  })

  it('counts a re-read as recent use, so it is not the next one dropped', () => {
    const cache = createThumbCache(2)
    cache.get('a', () => pixels(1))
    cache.get('b', () => pixels(2))
    cache.get('a', () => pixels(1))
    cache.get('c', () => pixels(3))

    expect(cache.has('a')).toBe(true)
    expect(cache.has('b')).toBe(false)
  })

  it('refuses a limit below one, because a cache of nothing is a bug not a setting', () => {
    expect(() => createThumbCache(0)).toThrow(/limit/)
  })

  it('does not cache a draw that threw', () => {
    const cache = createThumbCache()
    expect(() => cache.get('fox', () => { throw new Error('no context') })).toThrow(/no context/)
    expect(cache.has('fox')).toBe(false)
  })

  it('forgets everything when cleared', () => {
    const cache = createThumbCache()
    cache.get('fox', () => pixels(1))
    cache.clear()
    expect(cache.size).toBe(0)
  })
})
