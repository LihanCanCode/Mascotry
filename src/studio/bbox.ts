/**
 * Path measurement. Build functions are documented to issue path commands only, so a recording
 * stub can run one and report the bounding box — which is what the form gradients need to know
 * where a shape's light side and shadow side are.
 */
import type { Build, Ctx } from './types'

export interface Box {
  readonly x0: number
  readonly y0: number
  readonly x1: number
  readonly y1: number
}

export const boxW = (b: Box): number => b.x1 - b.x0
export const boxH = (b: Box): number => b.y1 - b.y0

/** Records every coordinate a build touches. Control points count: they bound the curve. */
class PathRecorder {
  x0 = Infinity; y0 = Infinity; x1 = -Infinity; y1 = -Infinity

  add(x: number, y: number): void {
    if (x < this.x0) this.x0 = x
    if (x > this.x1) this.x1 = x
    if (y < this.y0) this.y0 = y
    if (y > this.y1) this.y1 = y
  }

  moveTo(x: number, y: number): void { this.add(x, y) }
  lineTo(x: number, y: number): void { this.add(x, y) }
  closePath(): void { /* no geometry */ }
  rect(x: number, y: number, w: number, h: number): void { this.add(x, y); this.add(x + w, y + h) }
  quadraticCurveTo(cx: number, cy: number, x: number, y: number): void { this.add(cx, cy); this.add(x, y) }
  bezierCurveTo(a: number, b: number, c: number, d: number, x: number, y: number): void {
    this.add(a, b); this.add(c, d); this.add(x, y)
  }
  arcTo(a: number, b: number, c: number, d: number): void { this.add(a, b); this.add(c, d) }
  arc(x: number, y: number, r: number): void { this.add(x - r, y - r); this.add(x + r, y + r) }
  ellipse(x: number, y: number, rx: number, ry: number): void {
    const r = Math.max(Math.abs(rx), Math.abs(ry))
    this.add(x - r, y - r); this.add(x + r, y + r)
  }
}

const EMPTY: Box = { x0: 0, y0: 0, x1: 0, y1: 0 }

/** Bounding box of a build's path, or a degenerate box when it drew nothing. */
export function measure(build: Build): Box {
  const rec = new PathRecorder()
  build(rec as unknown as Ctx)
  if (!Number.isFinite(rec.x0) || !Number.isFinite(rec.y0)) return EMPTY
  return { x0: rec.x0, y0: rec.y0, x1: rec.x1, y1: rec.y1 }
}

/** Smallest box containing both. */
export const merge = (a: Box, b: Box): Box => ({
  x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1),
})
