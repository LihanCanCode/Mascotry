import { describe, expect, it } from 'vitest'
import { boxH, boxW, measure, merge } from './bbox'
import { ellipse, heartPath, roundRect, smooth } from './draw'
import type { Build } from './types'

describe('measure', () => {
  it('bounds a straight polyline', () => {
    expect(measure((c) => { c.moveTo(10, 20); c.lineTo(50, 5); c.closePath() }))
      .toEqual({ x0: 10, y0: 5, x1: 50, y1: 20 })
  })

  it('bounds an ellipse by its largest radius', () => {
    const b = measure((c) => ellipse(c, 100, 50, 30, 10))
    expect(b).toEqual({ x0: 70, y0: 20, x1: 130, y1: 80 })
    expect(boxW(b)).toBe(60)
    expect(boxH(b)).toBe(60)
  })

  it('includes curve control points, which always contain the curve', () => {
    const b = measure((c) => { c.moveTo(0, 0); c.quadraticCurveTo(50, -40, 100, 0) })
    expect(b.y0).toBe(-40)
    expect(b.x1).toBe(100)
  })

  it('bounds beziers, rects and arcs', () => {
    expect(measure((c) => c.bezierCurveTo(1, 2, 3, 4, 5, 6))).toEqual({ x0: 1, y0: 2, x1: 5, y1: 6 })
    expect(measure((c) => c.rect(10, 10, 20, 5))).toEqual({ x0: 10, y0: 10, x1: 30, y1: 15 })
    expect(measure((c) => c.arc(0, 0, 7, 0, 1))).toEqual({ x0: -7, y0: -7, x1: 7, y1: 7 })
    expect(measure((c) => roundRect(c, 0, 0, 40, 20, 5))).toEqual({ x0: 0, y0: 0, x1: 40, y1: 20 })
  })

  it('returns a degenerate box when the build draws nothing', () => {
    expect(measure(() => undefined)).toEqual({ x0: 0, y0: 0, x1: 0, y1: 0 })
  })

  it('handles the real part shapes without throwing', () => {
    const builds: Build[] = [
      (c) => heartPath(c, 2),
      (c) => smooth(c, [{ x: 0, y: 0 }, { x: 10, y: 20 }, { x: 30, y: 5 }]),
    ]
    for (const b of builds) expect(boxW(measure(b))).toBeGreaterThan(0)
  })
})

describe('merge', () => {
  it('returns the smallest box containing both', () => {
    expect(merge({ x0: 0, y0: 0, x1: 10, y1: 10 }, { x0: -5, y0: 4, x1: 6, y1: 30 }))
      .toEqual({ x0: -5, y0: 0, x1: 10, y1: 30 })
  })
})
