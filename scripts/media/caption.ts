/**
 * Burnt-in captions.
 *
 * Most of a feed is watched with the sound off, so the words are part of the
 * picture rather than a subtitle track. They sit on a solid ink slab inside
 * the middle 80% of the frame, clear of the bars of controls every platform
 * lays over the top and bottom.
 */
import { INK, PAINT, PAINT_INK } from './palette'
import { DISPLAY_FONT, roundRect } from './surface'
import type { Ctx2D } from './surface'

export interface Frame { readonly width: number; readonly height: number }

export type Tone = 'ink' | 'paint'

/** Bottom of the caption block, as a fraction of frame height. Inside the safe area. */
const BASELINE = 0.87

function fontSize(frame: Frame): number {
  return Math.round(Math.min(frame.width * 0.058, frame.height * 0.072))
}

function wrap(ctx: Ctx2D, text: string, limit: number): readonly string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const next = line === '' ? word : `${line} ${word}`
    if (line !== '' && ctx.measureText(next).width > limit) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line !== '') lines.push(line)
  return lines
}

export function drawCaption(ctx: Ctx2D, text: string, frame: Frame, tone: Tone = 'ink'): void {
  if (text === '') return
  const size = fontSize(frame)
  ctx.save()
  ctx.font = `600 ${size}px "${DISPLAY_FONT}"`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  const lines = wrap(ctx, text, frame.width * 0.8)
  const lineHeight = Math.round(size * 1.34)
  const padX = Math.round(size * 0.52)
  const padY = Math.round(size * 0.2)
  const bottom = frame.height * BASELINE
  const top = bottom - lines.length * lineHeight

  lines.forEach((line, i) => {
    const centreY = top + lineHeight * (i + 0.5)
    const width = ctx.measureText(line).width + padX * 2
    const height = lineHeight - padY
    ctx.fillStyle = tone === 'paint' ? PAINT : INK
    roundRect(ctx, (frame.width - width) / 2, centreY - height / 2, width, height, Math.round(size * 0.22))
    ctx.fill()
    ctx.fillStyle = PAINT_INK
    ctx.fillText(line, frame.width / 2, centreY + size * 0.04)
  })
  ctx.restore()
}
