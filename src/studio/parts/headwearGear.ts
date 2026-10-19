/**
 * Headwear that guards rather than covers: a visor, a sweatband, a caged helmet and a bubble.
 * The two helmets are the only pieces in the rig that draw in front of the face, so both keep
 * their obstruction thin or translucent — a mascot whose eyes you cannot find is not a mascot.
 */
import { clamp, ellipse, ink, smooth } from '../draw'
import { rgba, shadedInk } from '../shade'
import type { Build, Ctx, Pt, Rig, SpherePt } from '../types'
import { domeBuild, edgeList, hatKit, strokeSpherePath } from './headwearShape'
import type { HatKit } from './headwearShape'

/** Latitudes of the band's upper and lower edges on the forehead. */
const BAND_TOP = 0.95
const BAND_BOT = 0.62

/** The strip of cloth or plastic across the forehead that a visor and a sweatband share. */
export function bandBuild(R: Rig, top = BAND_TOP, bot = BAND_BOT): Build {
  const a = R.pts(edgeList(top), 1.07, true)
  const b = R.pts(edgeList(bot), 1.07, true)
  return (c) => smooth(c, [...a, ...b.slice().reverse()])
}

function paintBand(ctx: Ctx, R: Rig, kit: HatKit, build: Build, spread: number): void {
  shadedInk(ctx, build, {
    base: kit.base, shade: kit.shade, line: kit.line, w: 6.5, off: [-5, -6],
    form: { mat: 'cloth', k: R.k, spread, rim: R.cfg.rimLight * 0.8 },
  })
}

/** How far the visor's front edge is pushed down the brow when the head faces the viewer. */
const PEAK_DROP = 30
const PEAK_SPAN = 1.15

/**
 * The same trick the cap brim uses: a plate pointing at the viewer projects to a hairline, so its
 * depth is drawn rather than projected, and the drawn part fades out as the turn takes over.
 */
function peakEdges(R: Rig): { readonly inner: Pt[]; readonly outer: Pt[] } {
  const front = clamp(R.proj(0, 0, 1).z, 0, 1)
  const inner: Pt[] = [], outer: Pt[] = []
  for (let i = 0; i <= 10; i++) {
    const t = -PEAK_SPAN + (2 * PEAK_SPAN * i) / 10
    const u = t / PEAK_SPAN
    inner.push(R.proj(t, BAND_BOT, 1.06, true))
    const o = R.proj(t, 0.36, 1.26, true)
    outer.push({ x: o.x, y: o.y + PEAK_DROP * front * (1 - 0.55 * u * u) })
  }
  return { inner, outer }
}

export const peakBuild = (R: Rig): Build => {
  const { inner, outer } = peakEdges(R)
  return (c) => smooth(c, [...inner, ...outer.slice().reverse()])
}

function drawVisor(ctx: Ctx, R: Rig, kit: HatKit): void {
  const { outer } = peakEdges(R)
  shadedInk(ctx, peakBuild(R), {
    base: kit.base, shade: kit.shade, line: kit.line, w: 6.5, off: [-3, -4],
    form: { mat: 'cloth', k: R.k, spread: 1.7, rim: R.cfg.rimLight * 0.7 },
    hi: (c) => {
      c.lineCap = 'round'; c.strokeStyle = kit.shade; c.globalAlpha = 0.85; c.lineWidth = 8
      c.beginPath(); smooth(c, outer, false); c.stroke(); c.globalAlpha = 1
    },
  })
  paintBand(ctx, R, kit, bandBuild(R), 1.6)
}

function drawHeadband(ctx: Ctx, R: Rig, kit: HatKit): void {
  paintBand(ctx, R, kit, bandBuild(R, 0.98, 0.58), 1.5)
  ctx.strokeStyle = kit.shade; ctx.lineWidth = 4; ctx.lineCap = 'round'
  strokeSpherePath(ctx, R, [[-1.4, 0.82], [0, 0.78], [1.4, 0.82]], 1.08)
}

const CAGE: readonly number[] = [-0.92, -0.46, 0, 0.46, 0.92]

/** The boxing helmet's shell: a deep dome that comes down past the temples. */
const helmetShell = (R: Rig): Build => domeBuild(R, { crown: 1.15, band: 0.18, depth: 1.08, wobble: 0.05 })

/** The shell and the bars; the bars stop short of the chin so the mouth stays legible. */
function drawGrilledHelmet(ctx: Ctx, R: Rig, kit: HatKit): void {
  shadedInk(ctx, helmetShell(R), {
    base: kit.base, shade: kit.shade, line: kit.line, w: 7, off: [-6, -7],
    form: { mat: 'metal', k: R.k, spread: 1.4, rim: R.cfg.rimLight * 0.9 },
  })
  ctx.lineCap = 'round'
  for (const [w, color] of [[9, kit.line], [4.5, kit.base]] as const) {
    ctx.strokeStyle = color; ctx.lineWidth = w
    for (const t of CAGE) strokeSpherePath(ctx, R, [[t, 0.22], [t * 0.95, -0.4], [t * 0.8, -0.98]], 1.16)
    strokeSpherePath(ctx, R, [[-0.95, -0.42], [0, -0.5], [0.95, -0.42]], 1.16)
  }
}

/** A sphere of glass: a wash, a bright crescent on the lit edge and a sealed ring at the neck. */
function drawBubbleHelmet(ctx: Ctx, R: Rig, kit: HatKit): void {
  const dome: Build = (c) => ellipse(c, R.cx, R.cy - 14, R.rx * 1.26, R.ry * 1.12)
  ctx.fillStyle = rgba(kit.hi, 0.13)
  ctx.beginPath(); dome(ctx); ctx.fill()
  ctx.save(); ctx.beginPath(); dome(ctx); ctx.clip()
  ctx.strokeStyle = rgba('#ffffff', 0.34); ctx.lineWidth = 16; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.ellipse(R.cx, R.cy - 14, R.rx * 1.14, R.ry * 1.0, 0, 3.3, 4.6); ctx.stroke()
  ctx.strokeStyle = rgba(kit.base, 0.3); ctx.lineWidth = 9
  ctx.beginPath(); ctx.ellipse(R.cx, R.cy - 14, R.rx * 1.1, R.ry * 0.96, 0, 0.5, 1.6); ctx.stroke()
  ctx.restore()
  ink(ctx, dome, { line: kit.line, w: 5, swell: 0.3 })
  shadedInk(ctx, (c) => ellipse(c, R.cx, R.cy + R.ry * 0.97, R.rx * 0.68, 13), {
    base: kit.base, shade: kit.shade, line: kit.line, w: 6,
    form: { mat: 'metal', k: R.k, spread: 1.6, rim: R.cfg.rimLight },
  })
}

const GEAR: Readonly<Record<string, (ctx: Ctx, R: Rig, kit: HatKit) => void>> = {
  visor: drawVisor, headband: drawHeadband, grilledHelmet: drawGrilledHelmet, bubbleHelmet: drawBubbleHelmet,
}

export const isGear = (hw: string): boolean => hw in GEAR

/** What each piece of gear casts onto the forehead; a bubble casts nothing worth drawing. */
export function gearShadowBuild(R: Rig): Build | null {
  const hw = R.cfg.headwear
  if (hw === 'visor') return peakBuild(R)
  if (hw === 'headband') return bandBuild(R, 0.98, 0.58)
  if (hw === 'grilledHelmet') return helmetShell(R)
  return null
}

export function drawGear(ctx: Ctx, R: Rig): void {
  const draw = GEAR[R.cfg.headwear]
  if (draw) draw(ctx, R, hatKit(R))
}

