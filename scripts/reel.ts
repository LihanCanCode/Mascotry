/**
 * The launch reel: a twenty-second vertical cut for the feeds, and a
 * sixteen-by-nine cut of the same twenty seconds for the timelines.
 *
 *   pnpm run reel
 *
 * Three of the six shots are the real application, recorded by Playwright and
 * then given back the cursor it never captured. The other three are drawn the
 * same way the README loop is drawn, by running `aimCell` and `poke` over a
 * known path, because perfect motion is easier to make than to perform.
 * Everything is composited through one canvas pass, so a recorded shot and a
 * drawn one carry identical captions in identical colours.
 */
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'
import type { Browser } from '@playwright/test'
import { loadImage } from '@napi-rs/canvas'
import { drawCaption } from './media/caption'
import type { Frame as FrameSize, Tone } from './media/caption'
import { drawClick, drawCursor } from './media/cursor'
import { centreColours, ffmpeg, report } from './media/ffmpeg'
import { drawMascot, presetById, renderCells } from './media/mascot'
import type { MascotCells } from './media/mascot'
import { BENCH, INK, INK_SOFT, PAINT, RULE, SHEET } from './media/palette'
import { cursorAt, recordShot } from './media/record'
import type { Recording, Size } from './media/record'
import { serve } from './media/serve'
import { RECORDED } from './media/shots'
import { BODY_FONT, DISPLAY_FONT, MONO_FONT, ctxOf, roundRect, surface } from './media/surface'
import type { Ctx2D } from './media/surface'
import { lap, orbitAt, perform, pokeBeat, travel } from './media/track'
import type { Frame as Beat, Orbit } from './media/track'

const FPS = 30
const CHARACTER = 'fox'
const SITE = 'lihancancode.github.io/Mascotry'
const PORT = 4339
const WORK = join('out', 'reel')

interface Cut {
  readonly kind: 'studio' | 'clip' | 'endcard'
  /** Which recorded shot, when `kind` is 'clip'. */
  readonly shot: string
  readonly frames: number
  readonly caption: string
  readonly tone: Tone
}

/** Six beats, in order, totalling twenty seconds. */
const CUTS: readonly Cut[] = [
  { kind: 'studio', shot: '', frames: 90, caption: 'I made a mascot that watches your cursor', tone: 'ink' },
  { kind: 'studio', shot: '', frames: 90, caption: 'poke it', tone: 'paint' },
  { kind: 'clip', shot: 'gallery', frames: 120, caption: '57 of them', tone: 'ink' },
  { kind: 'clip', shot: 'describe', frames: 150, caption: 'or just describe one', tone: 'ink' },
  { kind: 'clip', shot: 'demo', frames: 90, caption: 'drop it on your site', tone: 'ink' },
  { kind: 'endcard', shot: '', frames: 60, caption: 'free · open source', tone: 'paint' },
]

const STUDIO_FRAMES = CUTS.filter((c) => c.kind === 'studio').reduce((n, c) => n + c.frames, 0)
const TOTAL = CUTS.reduce((n, c) => n + c.frames, 0)

interface Edition {
  readonly name: string
  readonly frame: FrameSize
  readonly viewport: Size
  readonly video: Size
  readonly output: string
}

const EDITIONS: readonly Edition[] = [
  {
    name: 'reel',
    frame: { width: 1080, height: 1920 },
    viewport: { width: 540, height: 960 },
    video: { width: 1080, height: 1920 },
    output: join('media', 'mascotry-reel.mp4'),
  },
  {
    name: 'demo',
    frame: { width: 1280, height: 720 },
    viewport: { width: 1280, height: 720 },
    video: { width: 1280, height: 720 },
    output: join('media', 'mascotry-demo.mp4'),
  },
]

/* ----------------------------- the drawn shots ----------------------------- */

interface Studio {
  readonly cx: number
  readonly cy: number
  readonly size: number
  readonly orbit: Orbit
  readonly poke: { readonly x: number; readonly y: number }
}

function studioGeometry(frame: FrameSize): Studio {
  const tall = frame.height > frame.width
  const size = Math.round(tall ? frame.width * 0.6 : frame.height * 0.55)
  const cx = frame.width / 2
  const cy = Math.round(frame.height * (tall ? 0.42 : 0.42))
  const rx = Math.round(frame.width * (tall ? 0.36 : 0.22))
  const ry = Math.round(frame.height * (tall ? 0.21 : 0.3))
  return {
    cx,
    cy,
    size,
    orbit: { cx, cy, rx, ry, from: -Math.PI / 2 },
    poke: { x: cx, y: cy - size * 0.085 },
  }
}

/** One lap, then four pokes: heart, sparkle, delighted, and the streak's dizzy. */
function studioBeats(geometry: Studio): readonly Beat[] {
  const start = orbitAt(geometry.orbit, 0)
  const moments = [
    ...lap(geometry.orbit, 90),
    ...travel(start, geometry.poke, 12),
    ...pokeBeat(geometry.poke, 18, 'heart'),
    ...pokeBeat(geometry.poke, 18, 'sparkle'),
    ...pokeBeat(geometry.poke, 18, 'delighted'),
    ...pokeBeat(geometry.poke, 24, 'blink'),
  ]
  if (moments.length !== STUDIO_FRAMES) {
    throw new Error(`the drawn shot is ${moments.length} frames, the cut asks for ${STUDIO_FRAMES}`)
  }
  return perform(moments, { fps: FPS, cx: geometry.cx, cy: geometry.cy })
}

function bench(ctx: Ctx2D, frame: FrameSize): void {
  ctx.fillStyle = BENCH
  ctx.fillRect(0, 0, frame.width, frame.height)
  const inset = Math.round(Math.min(frame.width, frame.height) * 0.035)
  ctx.fillStyle = SHEET
  roundRect(ctx, inset, inset, frame.width - inset * 2, frame.height - inset * 2, inset / 2)
  ctx.fill()
  ctx.strokeStyle = RULE
  ctx.lineWidth = 3
  ctx.stroke()
}

function cursorLook(scale: number): { scale: number; fill: string; stroke: string } {
  return { scale, fill: '#ffffff', stroke: INK }
}

/** The drawn shots have no footage to match, so the arrow is sized to the frame. */
function drawnCursor(frame: FrameSize): number {
  return Math.min(frame.width, frame.height) / 230
}

function paintStudio(ctx: Ctx2D, frame: FrameSize, cells: MascotCells, geometry: Studio, beat: Beat): void {
  bench(ctx, frame)
  drawMascot(ctx, cells, {
    cx: geometry.cx,
    cy: geometry.cy,
    cell: beat.cell,
    mood: beat.mood,
    squash: beat.squash,
  })
  if (beat.click !== null) drawClick(ctx, beat.x, beat.y, beat.click, PAINT)
  drawCursor(ctx, beat.x, beat.y, cursorLook(drawnCursor(frame)))
}

function paintEndCard(ctx: Ctx2D, frame: FrameSize, cells: MascotCells, index: number): void {
  bench(ctx, frame)
  const unit = Math.min(frame.width, frame.height)
  const rise = Math.min(1, index / 12)
  const tall = frame.height > frame.width
  const cy = Math.round(frame.height * (tall ? 0.35 : 0.34))
  // One blink, late enough that the card has settled and early enough to be seen.
  const blinking = index >= 34 && index < 40
  ctx.save()
  ctx.globalAlpha = rise
  drawMascot(ctx, cells, { cx: frame.width / 2, cy, cell: 4, mood: blinking ? 0 : null, squash: 0 })

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  const lift = (1 - rise) * unit * 0.04
  let y = cy + cells.size * 0.6 + lift
  ctx.fillStyle = INK
  ctx.font = `700 ${Math.round(unit * 0.13)}px "${DISPLAY_FONT}"`
  ctx.fillText('Mascotry', frame.width / 2, y)
  y += unit * 0.072
  ctx.fillStyle = INK_SOFT
  ctx.font = `400 ${Math.round(unit * 0.04)}px "${BODY_FONT}"`
  ctx.fillText('Draw a mascot that watches the reader.', frame.width / 2, y)
  y += unit * 0.07
  ctx.fillStyle = PAINT
  ctx.font = `600 ${Math.round(unit * 0.04)}px "${MONO_FONT}"`
  ctx.fillText(SITE, frame.width / 2, y)
  ctx.restore()
}

/* --------------------------- the recorded shots --------------------------- */

interface Clip {
  readonly files: readonly string[]
  readonly dir: string
  /** Where the clapper ended in the raw recording, kept for the log. */
  readonly zero: number
  readonly scale: number
  readonly recording: Recording
}

function frameFiles(dir: string): readonly string[] {
  return readdirSync(dir).filter((file) => file.endsWith('.jpg')).sort()
}

/** True for the flat chroma green of the clapper. */
function isClap(colour: readonly [number, number, number]): boolean {
  const [r, g, b] = colour
  return g > 150 && r < 130 && b < 150 && g - r > 60 && g - b > 40
}

function extract(recording: Recording, into: string, edition: Edition): Clip {
  rmSync(into, { recursive: true, force: true })
  mkdirSync(into, { recursive: true })
  // The recording also contains everything the shot did to get ready, so the
  // clapper is found first and only the frames after it are written out.
  const colours = centreColours(recording.video, FPS)
  let zero = 0
  colours.forEach((colour, i) => { if (isClap(colour)) zero = i + 1 })
  if (zero === 0) throw new Error(`no clapper found in ${recording.name}; the cursor cannot be synced`)
  ffmpeg([
    '-i', recording.video,
    '-vf', `fps=${FPS},select=gte(n\\,${zero})`, '-fps_mode', 'passthrough',
    '-q:v', '3', '-start_number', '0', join(into, '%05d.jpg'),
  ])
  return { files: frameFiles(into), dir: into, zero, scale: edition.frame.width / recording.viewport.width, recording }
}

async function paintClip(ctx: Ctx2D, frame: FrameSize, clip: Clip, index: number): Promise<void> {
  const pick = Math.min(index, clip.files.length - 1)
  const file = clip.files[pick]
  if (file === undefined) throw new Error(`no frame ${pick} in ${clip.dir}`)
  ctx.drawImage(await loadImage(join(clip.dir, file)), 0, 0, frame.width, frame.height)
  const where = cursorAt(clip.recording.track, (index * 1000) / FPS)
  // Sized against the footage rather than the frame: the browser painted at
  // `clip.scale` device pixels per CSS pixel, so that is how big a real pointer
  // would have been in these frames.
  if (where !== null) drawCursor(ctx, where.x * clip.scale, where.y * clip.scale, cursorLook(2.1 * clip.scale))
}

/* -------------------------------- assembly -------------------------------- */

async function build(edition: Edition, browser: Browser, origin: string): Promise<void> {
  const work = join(WORK, edition.name)
  rmSync(work, { recursive: true, force: true })
  mkdirSync(work, { recursive: true })

  const clips = new Map<string, Clip>()
  for (const plan of RECORDED) {
    const recording = await recordShot(
      browser, plan, origin, edition.viewport, edition.video, join(work, 'video'),
    )
    const clip = extract(recording, join(work, plan.name), edition)
    console.log(`  ${plan.name}: clapper ends at raw frame ${clip.zero}, ${clip.files.length} frames kept, `
      + `${recording.track.length} cursor samples over `
      + `${Math.round(recording.track[recording.track.length - 1]?.t ?? 0)}ms`)
    clips.set(plan.name, clip)
  }

  const geometry = studioGeometry(edition.frame)
  const beats = studioBeats(geometry)
  const character = presetById(CHARACTER).config
  const cells = renderCells(character, geometry.size)
  const endCells = renderCells(character, Math.round(Math.min(edition.frame.width, edition.frame.height) * 0.36))

  const frames = join(work, 'frames')
  mkdirSync(frames, { recursive: true })
  let global = 0
  let studioAt = 0
  let endAt = 0
  for (const cut of CUTS) {
    const clip = cut.kind === 'clip' ? clips.get(cut.shot) : undefined
    if (cut.kind === 'clip' && clip === undefined) throw new Error(`no clip for ${cut.shot}`)
    for (let i = 0; i < cut.frames; i += 1) {
      const canvas = surface(edition.frame.width, edition.frame.height)
      const ctx = ctxOf(canvas)
      if (cut.kind === 'studio') {
        const beat = beats[studioAt]
        if (!beat) throw new Error(`no drawn beat ${studioAt}`)
        paintStudio(ctx, edition.frame, cells, geometry, beat)
        studioAt += 1
      } else if (cut.kind === 'endcard') {
        paintEndCard(ctx, edition.frame, endCells, endAt)
        endAt += 1
      } else if (clip) {
        await paintClip(ctx, edition.frame, clip, i)
      }
      drawCaption(ctx, cut.caption, edition.frame, cut.tone)
      writeFileSync(join(frames, `${String(global).padStart(5, '0')}.png`), canvas.toBuffer('image/png'))
      global += 1
    }
  }
  if (global !== TOTAL) throw new Error(`built ${global} frames, expected ${TOTAL}`)

  mkdirSync('media', { recursive: true })
  // A silent stereo track, because several feeds treat a video with no audio
  // stream at all as broken rather than as quiet.
  ffmpeg([
    '-framerate', String(FPS), '-i', join(frames, '%05d.png'),
    '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
    '-shortest',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-profile:v', 'high', '-level', '4.2', '-movflags', '+faststart',
    '-c:a', 'aac', '-b:a', '96k',
    edition.output,
  ])
  report(edition.name, edition.output)
}

async function main(): Promise<void> {
  const site = await serve('dist', PORT)
  // Playwright records CSS pixels and pads rather than scales when asked for a
  // larger video, so the browser is told to paint at 2x instead. That is what
  // makes a 540px-wide layout come out as a sharp 1080px-wide frame.
  const browser = await chromium.launch({ args: ['--force-device-scale-factor=2'] })
  try {
    for (const edition of EDITIONS) {
      console.log(`${edition.name}: ${edition.frame.width}x${edition.frame.height}, ${TOTAL} frames at ${FPS}fps`)
      await build(edition, browser, site.origin)
    }
  } finally {
    await browser.close()
    await site.stop()
  }
}

await main()
