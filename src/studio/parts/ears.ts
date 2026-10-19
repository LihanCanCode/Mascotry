// Ears: animal ears (behind the head), human ears (behind or in front depending on turn), bolt ears.
import { ellipse, ink, inkOf, roundRect, shadeOf } from '../draw'
import { occlude, shadedInk } from '../shade'
import type { Build, Ctx, Material, Rig } from '../types'

const EAR_POS: Readonly<Record<string, readonly [number, number]>> = {
  cat: [0.8, 0.86], fox: [0.82, 0.84], bear: [1.0, 0.74], bunny: [0.5, 0.98],
}
const SIDES = [-1, 1] as const

/** Ears share the head's material and take a touch more spread: they are small forms. */
const earForm = (R: Rig, spread: number): { mat: Material; k: number; spread: number } =>
  ({ mat: R.mat, k: R.k, spread })

const catEar: Build = (c) => {
  c.moveTo(-44, 26); c.quadraticCurveTo(-44, -34, -5, -78); c.quadraticCurveTo(0, -82, 5, -78)
  c.quadraticCurveTo(44, -34, 44, 26); c.closePath()
}
const foxEar: Build = (c) => {
  c.moveTo(-42, 26); c.quadraticCurveTo(-46, -40, 2, -92); c.quadraticCurveTo(7, -96, 10, -90)
  c.quadraticCurveTo(48, -40, 42, 26); c.closePath()
}

function drawCatEar(ctx: Ctx, R: Rig): void {
  const { pal, cfg } = R
  shadedInk(ctx, catEar, { base: pal.skin, shade: pal.skinShade, line: pal.lineSkin, w: 7, off: [-5, -3], form: earForm(R, 1.5) })
  const inner: Build = (c) => {
    c.moveTo(-26, 14); c.quadraticCurveTo(-26, -24, -2, -54); c.quadraticCurveTo(2, -56, 4, -52)
    c.quadraticCurveTo(26, -24, 26, 14); c.closePath()
  }
  ink(ctx, inner, { fill: cfg.earInner, fillOnly: true })
  // The ear cups forward, so its own left rim throws a shadow across the inner surface.
  ctx.save(); ctx.beginPath(); inner(ctx); ctx.clip()
  occlude(ctx, (c) => { c.moveTo(-70, -120); c.lineTo(-30, -120); c.lineTo(-18, 30); c.lineTo(-70, 30); c.closePath() },
    { color: shadeOf(cfg.earInner, 1.6), alpha: 0.55 * R.k, dx: 16, dy: 2, steps: 4 })
  ctx.restore()
}

function drawFoxEar(ctx: Ctx, R: Rig): void {
  const { pal, cfg } = R
  shadedInk(ctx, foxEar, { base: pal.skin, shade: pal.skinShade, line: pal.lineSkin, w: 7, off: [-5, -3], form: earForm(R, 1.5) })
  ctx.save(); ctx.beginPath(); foxEar(ctx); ctx.clip()
  ctx.fillStyle = cfg.earTip; ctx.fillRect(-60, -120, 120, 70)
  ctx.restore()
  ink(ctx, (c) => {
    c.moveTo(-22, 16); c.quadraticCurveTo(-24, -16, 0, -40); c.quadraticCurveTo(24, -16, 22, 16); c.closePath()
  }, { fill: cfg.muzzle, fillOnly: true })
  ink(ctx, foxEar, { line: pal.lineSkin, w: 7 })
}

function drawAnimalEar(ctx: Ctx, R: Rig, side: number): void {
  const { cfg, pal } = R
  const pos = EAR_POS[cfg.ears]
  if (!pos) return
  const P = R.proj(side * pos[0], pos[1], 1.0, true)
  const rot = side * (cfg.ears === 'bunny' ? 0.2 : 0.3) - R.dy * side * 0.14
  R.at(ctx, P, rot, () => {
    if (cfg.ears === 'cat') drawCatEar(ctx, R)
    else if (cfg.ears === 'fox') drawFoxEar(ctx, R)
    else if (cfg.ears === 'bear') {
      const outer = cfg.earColor ?? pal.skin
      shadedInk(ctx, (c) => ellipse(c, 0, -6, 38, 36), {
        base: outer, shade: cfg.earColor ? shadeOf(cfg.earColor) : pal.skinShade,
        line: inkOf(outer, cfg.outline, cfg.lineTint), w: 7, off: [-5, -4], form: earForm(R, 1.6),
      })
      const inner: Build = (c) => ellipse(c, 1, -1, 21, 20)
      ink(ctx, inner, { fill: cfg.earInner, line: pal.skinShade, w: 4, swell: 0 })
      ctx.save(); ctx.beginPath(); inner(ctx); ctx.clip()
      occlude(ctx, (c) => ellipse(c, 1, -26, 23, 20), { color: shadeOf(cfg.earInner, 2), alpha: 0.6 * R.k, dx: 0, dy: 8, steps: 3 })
      ctx.restore()
    } else {
      shadedInk(ctx, (c) => ellipse(c, 0, -40, 25, 58), { base: pal.skin, shade: pal.skinShade, line: pal.lineSkin, w: 7, off: [-5, -4], form: earForm(R, 1.4) })
      ink(ctx, (c) => ellipse(c, 1, -38, 12, 40), { fill: cfg.earInner, fillOnly: true })
    }
  }, Math.max(P.sx, 0.5))
}

function drawSideEar(ctx: Ctx, R: Rig, side: number): void {
  const { cfg, pal } = R
  const P = R.proj(side * 1.5, -0.06, 1.1)
  R.at(ctx, P, 0, () => {
    if (cfg.ears === 'bolt') {
      shadedInk(ctx, (c) => roundRect(c, -15, -30, 30, 60, 9), {
        base: pal.accent, shade: pal.accentShade, line: pal.lineAccent, w: 6, form: earForm(R, 1.5),
      })
      ink(ctx, (c) => ellipse(c, 0, 0, 7, 7), { fill: pal.accentShade, line: pal.lineAccent, w: 3.5, swell: 0 })
      return
    }
    shadedInk(ctx, (c) => ellipse(c, 0, 0, 21, 28), { base: pal.skin, shade: pal.skinShade, line: pal.lineSkin, w: 6.5, off: [-3, -3], form: earForm(R, 1.6) })
    ctx.strokeStyle = pal.skinDeep; ctx.lineWidth = 4; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.arc(1, 2, 9, 0.6, 3.4); ctx.stroke()
  }, Math.max(P.sx, 0.72))
}

const sideEarInFront = (R: Rig, side: number): boolean => R.proj(side * 1.5, -0.06, 1.1).z > 0.3
/** A hijab covers human ears entirely. */
const earsHidden = (R: Rig): boolean => R.cfg.headwear === 'hijab' && R.cfg.ears === 'human'

/** Animal ears sit on the skull and drop a shadow at their roots. Call with the head clip active. */
export function drawEarShadow(ctx: Ctx, R: Rig): void {
  const pos = EAR_POS[R.cfg.ears]
  if (!R.animal || R.k <= 0 || !pos) return
  for (const side of SIDES) {
    const P = R.proj(side * pos[0], pos[1], 1.0, true)
    if (P.z < -0.3) continue
    R.at(ctx, P, 0, () => {
      occlude(ctx, (c) => ellipse(c, 0, -18, 30, 18), {
        color: R.pal.skinDeep, alpha: 0.42 * R.k, dx: 1, dy: 13, steps: 3,
      })
    }, Math.max(P.sx, 0.5))
  }
}

export function drawEarsBack(ctx: Ctx, R: Rig): void {
  if (R.animal) {
    SIDES.forEach((s) => drawAnimalEar(ctx, R, s))
    return
  }
  if (earsHidden(R)) return
  SIDES.forEach((s) => { if (!sideEarInFront(R, s)) drawSideEar(ctx, R, s) })
}

export function drawEarsFront(ctx: Ctx, R: Rig): void {
  if (R.animal || earsHidden(R)) return
  SIDES.forEach((s) => { if (sideEarInFront(R, s)) drawSideEar(ctx, R, s) })
}
