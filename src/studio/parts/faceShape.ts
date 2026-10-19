// Head fill and the features that follow the head shape: cheek tufts (ruff / fluff) and eye patches.
import { clamp, ellipse, hexToRgb, ink, rgbToHsl, unionInk } from '../draw'
import { measure, merge } from '../bbox'
import { fillForm, formPaint, rgba, rimLight } from '../shade'
import type { Build, Ctx, Pt, Rig } from '../types'

interface Tuft {
  /** Canvas angle on the right cheek (0 = right, +y down); mirrored for the left side. */
  readonly t: number
  readonly len: number
  readonly half: number
}

const RUFF: readonly Tuft[] = [
  { t: 0.1, len: 30, half: 0.21 }, { t: 0.38, len: 32, half: 0.21 }, { t: 0.64, len: 24, half: 0.19 },
]
const FLUFF: readonly Tuft[] = [{ t: 0.22, len: 20, half: 0.18 }, { t: 0.5, len: 16, half: 0.16 }]

/** Pointy fur tuft sticking out of the silhouette at canvas angle t. */
function tuftPath(R: Rig, t: number, tuft: Tuft): (c: Ctx) => void {
  const a = R.sil(t - tuft.half, 0.96)
  const b = R.sil(t + tuft.half, 0.96)
  const m = R.sil(t, 1)
  const nx = (m.x - R.cx) / R.rx, ny = (m.y - R.cy) / R.ry
  const k = Math.hypot(nx, ny) || 1
  const tip: Pt = { x: m.x + (nx / k) * tuft.len, y: m.y + (ny / k) * tuft.len * 0.6 + tuft.len * 0.35 }
  const upper = a.y <= b.y
  const ca: Pt = { x: (a.x + tip.x) / 2 + nx * 12, y: (a.y + tip.y) / 2 + (upper ? -8 : 12) }
  const cb: Pt = { x: (b.x + tip.x) / 2 + nx * 4, y: (b.y + tip.y) / 2 + (upper ? 12 : -8) }
  return (c) => {
    c.moveTo(a.x, a.y); c.quadraticCurveTo(ca.x, ca.y, tip.x, tip.y)
    c.quadraticCurveTo(cb.x, cb.y, b.x, b.y); c.closePath()
  }
}

/**
 * Cheek tufts, drawn before the head so the head outline hides their roots. They are inked as one
 * union rather than one shape each: separately outlined tufts read as detached loops pinned to the
 * side of the face, whereas a shared outline reads as a single scalloped fringe of fur.
 */
export function drawCheekTufts(ctx: Ctx, R: Rig): void {
  const { cfg, pal } = R
  if (cfg.cheekFluff === 'none') return
  const list = cfg.cheekFluff === 'ruff' ? RUFF : FLUFF
  const builds: Build[] = []
  for (const tuft of list) {
    for (const t of [tuft.t, Math.PI - tuft.t]) builds.push(tuftPath(R, t, tuft))
  }
  const box = builds.map(measure).reduce(merge)
  const paint = formPaint(ctx, box, { base: cfg.muzzle, mat: R.mat, k: R.k, spread: 1.3 })
  unionInk(ctx, builds, { fill: paint, line: pal.lineMuzzle, w: 5.5 })
}

/**
 * A tight specular for metal, a broad soft sheen for everything else. It fades out at its own
 * edge and fades away entirely on a near-white head, where a tinted highlight has nowhere left
 * to go and reads as a smudge rather than as light.
 */
function drawSheen(ctx: Ctx, R: Rig): void {
  const H = R.proj(-0.6, 0.85, 1)
  if (H.z <= 0.1) return
  const metal = R.mat === 'metal'
  const headroom = clamp((0.94 - rgbToHsl(hexToRgb(R.cfg.skin))[2]) * 3.2, 0, 1)
  const alpha = (metal ? 0.9 : 0.5) * headroom
  if (alpha < 0.02) return
  const rx = (metal ? 22 : 34) * H.sx, ry = metal ? 7 : 11
  ctx.save(); ctx.translate(H.x, H.y); ctx.rotate(-0.5); ctx.scale(1, ry / rx)
  const g = ctx.createRadialGradient(0, 0, metal ? rx * 0.55 : 0, 0, 0, rx)
  g.addColorStop(0, rgba(R.pal.skinHi, alpha))
  g.addColorStop(1, rgba(R.pal.skinHi, 0))
  ctx.fillStyle = g
  ctx.beginPath(); ellipse(ctx, 0, 0, rx, rx); ctx.fill()
  ctx.restore()
}

/** Head volume: one radial gradient lit from the upper left, a sheen, and a lit-side rim. */
export function drawHeadFill(ctx: Ctx, R: Rig): void {
  const build: Build = (c) => R.head(c)
  fillForm(ctx, build, { base: R.cfg.skin, mat: R.mat, k: R.k })
  ctx.save(); ctx.beginPath(); R.head(ctx); ctx.clip()
  drawSheen(ctx, R)
  ctx.restore()
  rimLight(ctx, build, R.pal.skinRim, R.mat === 'metal' ? 6 : 4.5, R.cfg.rimLight * 0.72)
}

/** Dark oval eye patches (panda style); drawn clipped to the head, under the eyes. */
export function drawEyePatches(ctx: Ctx, R: Rig): void {
  if (R.cfg.eyePatch === 'none') return
  for (const side of [-1, 1]) {
    const P = R.proj(side * 0.48, -0.02, 1.02)
    if (P.z < 0.02) continue
    R.at(ctx, P, side * 0.5, () => {
      ctx.fillStyle = R.cfg.patchColor; ctx.beginPath(); ellipse(ctx, 0, 2, 44, 56); ctx.fill()
    }, Math.max(P.sx, 0.4))
  }
}
