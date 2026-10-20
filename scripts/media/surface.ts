/**
 * Canvas plumbing shared by the launch-media scripts.
 *
 * The studio draws onto anything that answers `getContext('2d')`, so the node
 * canvas is handed straight to it. Everything else here is the small amount of
 * glue needed to move a `Pixels` buffer onto a surface and to name the fonts
 * the site itself uses, so a rendered frame and a screenshot of the app agree.
 */
import { Canvas, ImageData, createCanvas } from '@napi-rs/canvas'
import type { SKRSContext2D } from '@napi-rs/canvas'
import type { CanvasFactory, CanvasLike } from '../../src/studio/types'
import type { Pixels } from '../../src/image/types'

export type Ctx2D = SKRSContext2D

/** The same three stacks `tokens.css` asks for, named as the system reports them. */
export const DISPLAY_FONT = 'Bahnschrift'
export const BODY_FONT = 'Segoe UI'
export const MONO_FONT = 'Consolas'

export function surface(width: number, height: number): Canvas {
  return createCanvas(width, height)
}

export function ctxOf(canvas: Canvas): Ctx2D {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no 2D context on the canvas')
  return ctx
}

/** The canvas factory the studio renderers take. */
export const studioFactory: CanvasFactory = (width, height) =>
  createCanvas(width, height) as unknown as CanvasLike

/** A pixel buffer, moved onto a surface of its own so it can be blitted. */
export function toCanvas(image: Pixels): Canvas {
  const canvas = createCanvas(image.width, image.height)
  ctxOf(canvas).putImageData(new ImageData(new Uint8ClampedArray(image.data), image.width, image.height), 0, 0)
  return canvas
}

export function roundRect(ctx: Ctx2D, x: number, y: number, w: number, h: number, r: number): void {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}
