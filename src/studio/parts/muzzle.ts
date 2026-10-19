// Muzzle patches and whiskers (animals) and the nose (animals and humans).
import { ellipse, ink, mix, shadeOf } from '../draw'
import { fillForm, occlude, rgba } from '../shade'
import type { Build, Ctx, Rig } from '../types'

type PatchSpec = readonly [theta: number, phi: number, rx: number, ry: number]

const PATCHES: Readonly<Record<string, readonly PatchSpec[]>> = {
  fox: [[-0.62, -0.5, 74, 46], [0.62, -0.5, 74, 46], [0, -0.82, 70, 44], [0, -0.42, 54, 40]],
  cat: [[-0.17, -0.46, 36, 27], [0.17, -0.46, 36, 27]],
  bear: [[0, -0.5, 62, 48]],
  bunny: [[-0.16, -0.48, 34, 29], [0.16, -0.48, 34, 29]],
}

export function drawMuzzlePads(ctx: Ctx, R: Rig): void {
  const { pal, cfg } = R
  for (const [th, ph, rx, ry] of PATCHES[cfg.ears] ?? []) {
    const P = R.proj(th, ph, 1.08)
    if (P.z < -0.2) continue
    R.at(ctx, P, 0, () => {
      const pad: Build = (c) => ellipse(c, 0, 0, rx, ry)
      // The pad sits proud of the skull, so it drops a shadow onto the face below it.
      occlude(ctx, pad, { color: pal.skinDeep, alpha: 0.5 * R.k, dx: 3, dy: 10, steps: 4 })
      fillForm(ctx, pad, { base: cfg.muzzle, mat: R.mat, k: R.k, spread: 1.9 })
    }, Math.max(P.sx, 0.4))
  }
}

export function drawWhiskers(ctx: Ctx, R: Rig): void {
  if (R.cfg.ears !== 'cat') return
  ctx.strokeStyle = R.pal.line; ctx.lineWidth = 3.5; ctx.lineCap = 'round'
  for (const s of [-1, 1]) {
    const P = R.proj(s * 0.62, -0.36, 1.04)
    if (P.z < 0.12) continue
    R.at(ctx, P, 0, () => {
      ctx.beginPath()
      for (const [dy, a] of [[-8, -0.18], [4, 0.02], [16, 0.2]] as const) {
        ctx.moveTo(s * 6, dy); ctx.lineTo(s * 52, dy + a * 52)
      }
      ctx.stroke()
    })
  }
}

const NOSE_SCALE: Readonly<Record<string, number>> = { bear: 1.35, cat: 0.8, bunny: 0.78 }

function drawAnimalNose(ctx: Ctx, R: Rig): void {
  const { pal, cfg } = R
  const P = R.proj(0, -0.27, 1.14)
  R.at(ctx, P, 0, () => {
    const col = cfg.ears === 'cat' || cfg.ears === 'bunny' ? '#ff8fa8' : cfg.noseColor
    const sz = NOSE_SCALE[cfg.ears] ?? 1
    ctx.save(); ctx.scale(sz, sz)
    ink(ctx, (c) => {
      c.moveTo(-16, -9); c.quadraticCurveTo(0, -17, 16, -9); c.quadraticCurveTo(15, 5, 0, 12)
      c.quadraticCurveTo(-15, 5, -16, -9); c.closePath()
    }, { fill: col, line: pal.line, w: 5, swell: 0.3 })
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ellipse(ctx, -5, -6.5, 5.5, 2.8, -0.15); ctx.fill()
    ctx.restore()
  })
}

/**
 * Human nose. An outlined bulb reads as a clown nose at this scale, so the form is carried by a
 * soft shadow down its right side, a small lit tip and two faint nostril marks instead.
 */
function drawHumanNose(ctx: Ctx, R: Rig): void {
  const { pal, cfg } = R
  const P = R.proj(0, -0.35, 1.14)
  R.at(ctx, P, 0, () => {
    const side: Build = (c) => {
      c.moveTo(4, -17); c.bezierCurveTo(12, -8, 17, 1, 15, 7)
      c.bezierCurveTo(12, 14, -8, 14, -12, 7)
      c.bezierCurveTo(-10, 2, -5, -2, -3, -9); c.closePath()
    }
    ctx.globalAlpha = 0.55 * Math.min(1, R.k)
    ctx.fillStyle = mix(cfg.skin, pal.skinDeep, 0.5)
    ctx.beginPath(); side(ctx); ctx.fill()
    ctx.globalAlpha = 1
    ctx.fillStyle = rgba(pal.skinHi, 0.85)
    ctx.beginPath(); ellipse(ctx, -3, 1, 7, 5, -0.35); ctx.fill()
    ctx.fillStyle = rgba(shadeOf(cfg.skin, 3.4), 0.8)
    for (const s of [-1, 1]) { ctx.beginPath(); ellipse(ctx, s * 8, 8, 3.2, 2.2, s * 0.3); ctx.fill() }
    ctx.strokeStyle = rgba(pal.skinDeep, 0.75); ctx.lineWidth = 3.2; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(-11, 5); ctx.quadraticCurveTo(-7, 12, 2, 12)
    ctx.quadraticCurveTo(11, 12, 14, 5); ctx.stroke()
  })
}

export function drawNose(ctx: Ctx, R: Rig): void {
  if (R.animal) drawAnimalNose(ctx, R)
  else if (R.cfg.ears !== 'bolt') drawHumanNose(ctx, R)
}
