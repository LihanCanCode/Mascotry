/**
 * The animated demo at the top of the README.
 *
 *   pnpm run gif
 *
 * A character follows a cursor around a closed lap, gets poked four times, and
 * the cursor returns to exactly where it started, so the loop has no seam. No
 * screen recording is involved: every pose comes from `aimCell` and every
 * reaction from `poke`, so the GIF is a proof of the runtime rather than an
 * illustration of it.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ffmpeg, report } from './media/ffmpeg'
import { drawClick, drawCursor } from './media/cursor'
import { drawMascot, presetById, renderCells } from './media/mascot'
import { BENCH, INK_SOFT, RULE, SHEET } from './media/palette'
import { DISPLAY_FONT, ctxOf, roundRect, surface } from './media/surface'
import { lap, orbitAt, perform, pokeBeat, still, travel } from './media/track'
import type { Frame, Moment, Orbit } from './media/track'

const WIDTH = 720
const HEIGHT = 440
const FPS = 14
const CHARACTER = 'fox'
const MASCOT = 300
/** Centre of the mascot element, and so the origin `aimCell` measures from. */
const CX = WIDTH / 2
const CY = 205
/** On the face rather than the chest, so the poke lands where a visitor's would. */
const POKE_AT = { x: CX, y: 180 }
const ORBIT: Orbit = { cx: CX, cy: CY, rx: 250, ry: 165, from: -Math.PI / 2 }

const FRAMES = join('out', 'gif-frames')
const PALETTE = join('out', 'gif-palette.png')
const OUTPUT = join('docs', 'images', 'demo.gif')

function script(): readonly Moment[] {
  const start = orbitAt(ORBIT, 0)
  return [
    ...lap(ORBIT, 36),
    ...travel(start, POKE_AT, 8),
    ...pokeBeat(POKE_AT, 8, 'heart'),
    ...pokeBeat(POKE_AT, 8, 'sparkle'),
    ...pokeBeat(POKE_AT, 8, 'delighted'),
    // The fourth poke in a row is the one the runtime answers with dizzy.
    ...pokeBeat(POKE_AT, 16, 'blink'),
    ...travel(POKE_AT, start, 11),
    ...still(start, 7),
  ]
}

function backdrop(ctx: ReturnType<typeof ctxOf>): void {
  ctx.fillStyle = BENCH
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
  ctx.fillStyle = SHEET
  roundRect(ctx, 12, 12, WIDTH - 24, HEIGHT - 24, 6)
  ctx.fill()
  ctx.strokeStyle = RULE
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = INK_SOFT
  ctx.font = `500 22px "${DISPLAY_FONT}"`
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('mascotry', 30, HEIGHT - 28)
}

function paint(frame: Frame, cells: ReturnType<typeof renderCells>): Buffer {
  const canvas = surface(WIDTH, HEIGHT)
  const ctx = ctxOf(canvas)
  backdrop(ctx)
  drawMascot(ctx, cells, { cx: CX, cy: CY, cell: frame.cell, mood: frame.mood, squash: frame.squash })
  if (frame.click !== null) drawClick(ctx, frame.x, frame.y, frame.click)
  drawCursor(ctx, frame.x, frame.y)
  return canvas.toBuffer('image/png')
}

/** The loop is only seamless if the last frame is the first one again. */
function assertSeamless(frames: readonly Frame[]): void {
  const first = frames[0]
  const last = frames[frames.length - 1]
  if (!first || !last) throw new Error('no frames')
  const same = first.x === last.x && first.y === last.y && first.cell === last.cell
    && first.mood === last.mood && first.squash === last.squash && first.click === last.click
  if (!same) throw new Error(`the loop does not close: ${JSON.stringify(first)} vs ${JSON.stringify(last)}`)
}

function main(): void {
  const preset = presetById(CHARACTER)
  const cells = renderCells(preset.config, MASCOT)
  const frames = perform(script(), { fps: FPS, cx: CX, cy: CY })
  assertSeamless(frames)

  rmSync(FRAMES, { recursive: true, force: true })
  mkdirSync(FRAMES, { recursive: true })
  frames.forEach((frame, i) => {
    writeFileSync(join(FRAMES, `${String(i).padStart(4, '0')}.png`), paint(frame, cells))
  })
  console.log(`${frames.length} frames at ${FPS}fps  ${(frames.length / FPS).toFixed(2)}s`)
  console.log(`poses used: ${[...new Set(frames.map((f) => f.cell))].sort((a, b) => a - b).join(' ')}`)
  console.log(`moods used: ${[...new Set(frames.flatMap((f) => (f.mood === null ? [] : [f.mood])))].sort((a, b) => a - b).join(' ')}`)

  const input = ['-framerate', String(FPS), '-i', join(FRAMES, '%04d.png')]
  // Two passes: one palette built across the whole clip, then applied. A
  // single-pass GIF picks a palette per frame and both looks worse and weighs
  // several times as much.
  ffmpeg([...input, '-vf', 'palettegen=stats_mode=diff:max_colors=128', '-frames:v', '1', PALETTE])
  ffmpeg([...input, '-i', PALETTE, '-lavfi',
    'paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle', '-loop', '0', OUTPUT])
  report('demo.gif', OUTPUT)
}

main()
