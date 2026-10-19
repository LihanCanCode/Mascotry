/**
 * Side accessories at ear level. They track the head exactly as the ears do: the cups are placed
 * at the ear's own longitude, and the band is a run of points across the crown, so the whole thing
 * turns with the skull instead of floating in front of it.
 */
import { ellipse, hiOf, ink, inkOf, roundRect, shadeOf, smooth } from '../draw'
import { shadedInk } from '../shade'
import type { Build, Ctx, Rig, SpherePt } from '../types'

const SIDES = [-1, 1] as const
/** Longitude of the ear; the cups sit on it so they cover what they are meant to cover. */
const EAR_T = 1.5
const EAR_P = -0.06

/** The band's path over the crown, far enough out to clear hair and most headwear. */
const BAND: readonly SpherePt[] = [
  [-1.42, 0.12], [-1.3, 0.62], [-1.0, 1.04], [-0.55, 1.32], [0, 1.44],
  [0.55, 1.32], [1.0, 1.04], [1.3, 0.62], [1.42, 0.12],
]

interface Kit {
  readonly base: string
  readonly shade: string
  readonly hi: string
  readonly line: string
}

const kitOf = (R: Rig): Kit => ({
  base: R.cfg.sideAccessoryColor,
  shade: shadeOf(R.cfg.sideAccessoryColor),
  hi: hiOf(R.cfg.sideAccessoryColor),
  line: inkOf(R.cfg.sideAccessoryColor, R.cfg.outline, R.cfg.lineTint),
})

/** A headband drawn as a stroke: outline pass, colour pass, then a lit sliver along the top. */
function drawBand(ctx: Ctx, R: Rig, kit: Kit, w: number): void {
  const p = R.pts(BAND, 1.19, true)
  const run: Build = (c) => smooth(c, p, false)
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.strokeStyle = kit.line; ctx.lineWidth = w + 7
  ctx.beginPath(); run(ctx); ctx.stroke()
  ctx.strokeStyle = kit.base; ctx.lineWidth = w
  ctx.beginPath(); run(ctx); ctx.stroke()
  if (R.cfg.rimLight <= 0) return
  ctx.strokeStyle = kit.hi; ctx.lineWidth = w * 0.26; ctx.globalAlpha = 0.8
  ctx.beginPath(); smooth(ctx, p.map((q) => ({ x: q.x - 2, y: q.y - w * 0.3 })), false); ctx.stroke()
  ctx.globalAlpha = 1
}

interface CupSpec {
  readonly rx: number
  readonly ry: number
  readonly pad: number
  readonly round: boolean
}

const CUPS: Readonly<Record<string, CupSpec>> = {
  headphones: { rx: 27, ry: 33, pad: 0.6, round: true },
  headset: { rx: 27, ry: 33, pad: 0.6, round: true },
  earDefenders: { rx: 32, ry: 42, pad: 0.66, round: false },
}

function cupBuild(spec: CupSpec): Build {
  if (spec.round) return (c) => ellipse(c, 0, 0, spec.rx, spec.ry)
  return (c) => roundRect(c, -spec.rx, -spec.ry, spec.rx * 2, spec.ry * 2, spec.rx * 0.55)
}

function drawCup(ctx: Ctx, R: Rig, kit: Kit, spec: CupSpec, side: number): void {
  const P = R.proj(side * EAR_T, EAR_P, 1.22)
  R.at(ctx, P, 0, () => {
    shadedInk(ctx, cupBuild(spec), {
      base: kit.base, shade: kit.shade, line: kit.line, w: 6.5, off: [-4, -5],
      form: { mat: 'cloth', k: R.k, spread: 1.4, rim: R.cfg.rimLight * 0.8 },
    })
    const inner = spec.pad
    ink(ctx, (c) => ellipse(c, 1, 1, spec.rx * inner, spec.ry * inner), { fill: kit.shade, line: kit.line, w: 3.5, swell: 0 })
  }, Math.max(P.sx, 0.55))
}

/**
 * Design-space row the boom must stay above. The arm reaches the lowest of anything on the head,
 * and a nodding pose swings it lower still, so it is clamped rather than trusted: one pixel into
 * the body band and the torso stops being identical across the nine cells.
 */
const BOOM_FLOOR = 352

/**
 * The boom arm, drawn only on the side still facing the viewer. It is the one deliberately
 * asymmetric part the rig has besides the ponytail, so it is kept slim.
 */
function drawBoom(ctx: Ctx, R: Rig, kit: Kit): void {
  const side = R.dx >= 0 ? -1 : 1
  const raw = R.pts([[side * 1.42, -0.42], [side * 1.2, -0.95], [side * 0.62, -1.02]], 1.2, true)
  const arm = raw.map((q) => ({ ...q, y: Math.min(q.y, BOOM_FLOOR) }))
  const tip = arm[arm.length - 1]
  if (!tip || arm.every((q) => q.z < 0.08)) return
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.strokeStyle = kit.line; ctx.lineWidth = 11
  ctx.beginPath(); smooth(ctx, arm, false); ctx.stroke()
  ctx.strokeStyle = kit.base; ctx.lineWidth = 5.5
  ctx.beginPath(); smooth(ctx, arm, false); ctx.stroke()
  ink(ctx, (c) => ellipse(c, tip.x, tip.y, 12, 9, side * 0.3), { fill: kit.shade, line: kit.line, w: 4, swell: 0.3 })
}

/** Draw the side accessory over the hair and headwear that are already on the head. */
export function drawSideAccessory(ctx: Ctx, R: Rig): void {
  const sa = R.cfg.sideAccessory
  if (sa === 'none') return
  const spec = CUPS[sa]
  if (!spec) return
  const kit = kitOf(R)
  drawBand(ctx, R, kit, sa === 'earDefenders' ? 19 : 14)
  for (const side of SIDES) drawCup(ctx, R, kit, spec, side)
  if (sa === 'headset') drawBoom(ctx, R, kit)
}
