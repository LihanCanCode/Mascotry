// Glasses: round or square frames with temples, bridge and a simple lens glint.
import { ellipse, ink, roundRect } from '../draw'
import { rgba } from '../shade'
import type { Ctx, Rig } from '../types'
import { EYE_T } from './eyes'
import type { EyeGeom } from './eyes'

const SIDES = [-1, 1] as const

/** Lenses track the eye size, so a small-eyed face does not end up wearing goggles. */
const lensK = (g: EyeGeom): number => 0.72 + 0.3 * g.k

const lensShape = (c: Ctx, round: boolean, s: number): void =>
  (round ? ellipse(c, 0, 0, 45 * s, 45 * s) : roundRect(c, -46 * s, -40 * s, 92 * s, 80 * s, 16 * s))

/**
 * Inside the lens: a shadow falling from the top rim and a narrow glint. Both stay off the iris.
 * A lens-wide tint or a fat opaque streak would hide the eye, which is the one thing a pair of
 * glasses must not do at this size.
 */
function drawLensSurface(ctx: Ctx, R: Rig, shape: (c: Ctx) => void): void {
  ctx.save(); ctx.beginPath(); shape(ctx); ctx.clip()
  const g = ctx.createLinearGradient(0, -46, 0, -8)
  g.addColorStop(0, rgba(R.pal.skinDeep, 0.3 * Math.min(1, R.k)))
  g.addColorStop(1, rgba(R.pal.skinDeep, 0))
  ctx.fillStyle = g; ctx.fillRect(-50, -50, 100, 44)
  ctx.strokeStyle = 'rgba(255,255,255,.42)'; ctx.lineCap = 'round'
  ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-29, -4); ctx.lineTo(-13, -30); ctx.stroke()
  ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-19, 13); ctx.lineTo(-12, 4); ctx.stroke()
  ctx.restore()
}

export function drawGlasses(ctx: Ctx, R: Rig, g: EyeGeom): void {
  const { cfg } = R
  if (cfg.glasses === 'none') return
  const frame = cfg.glassesColor
  const round = cfg.glasses === 'round'
  const k = lensK(g)
  ctx.save(); ctx.beginPath(); R.head(ctx, 1.08); ctx.clip()
  const lenses = SIDES.map((s) => ({ s, P: R.proj(s * EYE_T, g.phi, 1.1) }))
  ctx.strokeStyle = frame; ctx.lineWidth = 6; ctx.lineCap = 'round'
  for (const { s, P } of lenses) {
    const e = R.proj(s * 1.5, 0.05, 1.04, true)
    const sx = Math.max(P.sx, 0.4)
    ctx.beginPath(); ctx.moveTo(P.x + s * 46 * k * sx, P.y - 4); ctx.lineTo(e.x, e.y); ctx.stroke()
  }
  const a = lenses[0], b = lenses[1]
  if (a && b) {
    ctx.beginPath(); ctx.moveTo(a.P.x + 44 * k * Math.max(a.P.sx, 0.4), a.P.y - 8)
    ctx.quadraticCurveTo((a.P.x + b.P.x) / 2, a.P.y - 18, b.P.x - 44 * k * Math.max(b.P.sx, 0.4), b.P.y - 8); ctx.stroke()
  }
  for (const { P } of lenses) {
    R.at(ctx, P, 0, () => {
      const shape = (c: Ctx): void => lensShape(c, round, k)
      ink(ctx, shape, { fill: 'rgba(205,232,255,.26)', line: frame, w: 6.5, swell: 0.5 })
      drawLensSurface(ctx, R, shape)
    }, Math.max(P.sx, 0.4))
  }
  ctx.restore()
}
