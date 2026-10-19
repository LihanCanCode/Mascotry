// Hair: messy (tapered locks), bob, buzz, bun, ponytail. Curly lives in hairCurly.ts.
import { ellipse, ink, mix, poly, rng, smooth } from '../draw'
import { occlude, shadedInk } from '../shade'
import type { Build, Ctx, Pt, Rig, SpherePt } from '../types'
import { drawCurlyBack, drawCurlyFront, curlyShadowBuilds } from './hairCurly'
import { edgeSeed, hairWobble } from './edge'
import {
  L_TEMPLE, R_TEMPLE, arcPts, drawHairlineFuzz, drawHighlightBand, drawParting, drawStrand,
  drawStrandField, strandBuild, wobbleLine,
} from './hairGeometry'
import type { Strand, StrandField } from './hairGeometry'
import type { HairStyle } from '../types'

const MESSY_LINE: readonly SpherePt[] = [
  [1.55, 0.22], [1.42, 0.4], [1.15, 0.62], [0.8, 0.8], [0.4, 0.9], [0, 0.94], [-0.4, 0.9], [-0.8, 0.8],
  [-1.15, 0.62], [-1.42, 0.4], [-1.55, 0.22],
]
const BOB_LINE: readonly SpherePt[] = [
  [1.5, -0.5], [1.45, -0.1], [1.2, 0.34], [0.82, 0.6], [0.4, 0.7], [0.05, 0.74], [-0.4, 0.68], [-0.82, 0.58],
  [-1.2, 0.34], [-1.45, -0.1], [-1.5, -0.5],
]
const BUN_LINE: readonly SpherePt[] = [
  [1.52, -0.25], [1.42, 0.2], [1.1, 0.5], [0.6, 0.68], [0.1, 0.78], [-0.3, 0.7], [-0.8, 0.58], [-1.2, 0.36],
  [-1.42, 0.2], [-1.52, -0.25],
]
const BUZZ_LINE: readonly SpherePt[] = [
  [1.45, 0], [1.3, 0.4], [0.9, 0.68], [0.4, 0.8], [0, 0.82], [-0.4, 0.8], [-0.9, 0.68], [-1.3, 0.4], [-1.45, 0],
]

const MESSY_STRANDS: readonly Strand[] = [
  { t: -1.25, w: 0.22, tipT: -1.38, tipP: 0.1 }, { t: -1.0, w: 0.26, tipT: -1.12, tipP: 0.26 },
  { t: -0.74, w: 0.24, tipT: -0.8, tipP: 0.56 }, { t: -0.22, w: 0.26, tipT: -0.14, tipP: 0.58 },
  { t: 0.22, w: 0.26, tipT: 0.34, tipP: 0.54 }, { t: 0.76, w: 0.24, tipT: 0.84, tipP: 0.56 },
  { t: 1.05, w: 0.26, tipT: 1.14, tipP: 0.26 }, { t: 1.3, w: 0.2, tipT: 1.4, tipP: 0.1 },
]

/**
 * Evenly cut locks read as a row of sawteeth, so each one is nudged per character. The locks sit
 * inside the head outline, so this never touches the silhouette the centred cell is judged on.
 */
function messyStrands(R: Rig): Strand[] {
  const rnd = rng(edgeSeed(R.cfg) ^ 0x6b1f2a53)
  return MESSY_STRANDS.map((s) => ({
    t: s.t, w: s.w * (0.78 + 0.5 * rnd()),
    tipT: s.tipT + (rnd() - 0.5) * 0.16, tipP: s.tipP + (rnd() - 0.42) * 0.3,
  }))
}
const TAU_ = Math.PI * 2


interface CapSpec {
  readonly s: number
  readonly n: number
  readonly line: readonly SpherePt[]
  readonly amps?: readonly number[]
  readonly a0?: number
  readonly a1?: number
  readonly afterOuter?: readonly Pt[]
  readonly afterLower?: readonly Pt[]
  readonly sharp?: boolean
}

/** Seeded ripple on a hair silhouette; scaled by the character's edge-texture dial. */
const capRipple = (R: Rig, n: number, amp: number): number[] =>
  hairWobble(n, edgeSeed(R.cfg), amp * R.cfg.edgeTexture)

/** Clumping along the hairline: the same palindromic wobble, applied to latitudes instead. */
const hairline = (R: Rig, line: readonly SpherePt[]): SpherePt[] =>
  wobbleLine(line, capRipple(R, line.length - 1, 0.075))

function capBuild(R: Rig, spec: CapSpec): Build {
  const outer = arcPts(R, spec.a0 ?? L_TEMPLE, spec.a1 ?? R_TEMPLE, spec.n, spec.s, spec.amps)
  const lower = R.pts(hairline(R, spec.line), 1.03, true)
  const all = [...outer, ...(spec.afterOuter ?? []), ...lower, ...(spec.afterLower ?? [])]
  return (c) => (spec.sharp ? poly(c, all) : smooth(c, all))
}

function capFor(R: Rig): Build | null {
  switch (R.cfg.hairStyle) {
    case 'messy':
      return capBuild(R, { s: 1.07, n: 16, line: MESSY_LINE, amps: capRipple(R, 16, 0.085), a0: Math.PI + 0.12, a1: TAU_ - 0.12 })
    case 'bun': case 'ponytail': return capBuild(R, { s: 1.06, n: 14, line: BUN_LINE, amps: capRipple(R, 14, 0.075) })
    case 'buzz': return capBuild(R, { s: 1.015, n: 16, line: BUZZ_LINE, amps: capRipple(R, 16, 0.065) })
    case 'bob': {
      const lo = R.sil(Math.PI - 0.36, 1.1, 0, 6), ro = R.sil(0.36, 1.1, 0, 6)
      return capBuild(R, {
        s: 1.13, n: 14, line: BOB_LINE, amps: capRipple(R, 14, 0.075),
        a0: Math.PI - 0.5, a1: Math.PI * 2 + 0.5, afterOuter: [ro], afterLower: [lo],
      })
    }
    default: return null
  }
}

/** Where each style's strands start, which way they run, and how many of them there are. */
const FIELDS: Readonly<Partial<Record<HairStyle, Omit<StrandField, 'line'>>>> = {
  // The crown sits well below the pole: near the top of the sphere every longitude projects to
  // almost the same point, so strands started up there collapse into a sunburst.
  messy: { crown: 1.14, part: -0.38, count: 7, w: 6 },
  bob: { crown: 1.12, part: -0.52, count: 9, w: 5.5 },
  bun: { crown: 1.08, part: 0, count: 9, w: 5 },
  ponytail: { crown: 1.08, part: 0, count: 9, w: 5 },
  buzz: { crown: 1.14, part: -0.3, count: 9, w: 3.5 },
}
const LINES: Readonly<Partial<Record<HairStyle, readonly SpherePt[]>>> = {
  messy: MESSY_LINE, bob: BOB_LINE, bun: BUN_LINE, ponytail: BUN_LINE, buzz: BUZZ_LINE,
}

function fieldFor(R: Rig): StrandField | null {
  const spec = FIELDS[R.cfg.hairStyle]
  const line = LINES[R.cfg.hairStyle]
  return spec && line ? { ...spec, line } : null
}

/** Every filled region of the front hair (used for the forehead cast shadow). */
function frontShapes(R: Rig): Build[] {
  if (R.cfg.headwear === 'hijab') return []
  if (R.cfg.hairStyle === 'curly') return curlyShadowBuilds(R)
  const cap = capFor(R)
  if (!cap || R.cfg.hairStyle === 'buzz') return []
  const strands = R.cfg.hairStyle === 'messy' ? messyStrands(R).map((s) => strandBuild(R, MESSY_LINE, s)) : []
  return [cap, ...strands]
}

/** Soft shadow the fringe casts on the forehead; call with the head clip active. */
export function drawHairCastShadow(ctx: Ctx, R: Rig): void {
  const shapes = frontShapes(R)
  if (!shapes.length) return
  // The cap is the mass that casts the real shadow; locks and curls only need a cheap nudge,
  // which keeps a curly or messy head from paying for dozens of extra fills per cell.
  const k = Math.min(1, R.k)
  const [cap, ...rest] = shapes
  if (cap) occlude(ctx, cap, { color: R.pal.skinDeep, alpha: 0.62 * k, dx: 2, dy: 17, steps: 4 })
  for (const b of rest) occlude(ctx, b, { color: R.pal.skinDeep, alpha: 0.5 * k, dx: 2, dy: 15, steps: 2 })
}

function drawBobBack(ctx: Ctx, R: Rig): void {
  const { pal } = R
  const pts = [
    ...arcPts(R, Math.PI - 0.55, Math.PI * 2 + 0.55, 14, 1.15),
    R.sil(0.3, 1.1, 0, 8), R.sil(Math.PI - 0.3, 1.1, 0, 8),
  ]
  shadedInk(ctx, (c) => smooth(c, pts), {
    base: pal.hair, shade: pal.hairShade, line: pal.lineHair, w: 6, off: [-6, -4],
    form: { mat: 'cloth', k: R.k, spread: 1.3 },
  })
}

function drawBun(ctx: Ctx, R: Rig): void {
  const { pal } = R
  const P = R.proj(0, 1.36, 1.22)
  R.at(ctx, P, 0, () => {
    shadedInk(ctx, (c) => ellipse(c, 0, 0, 52, 48), {
      base: pal.hair, shade: pal.hairShade, line: pal.lineHair, w: 7, off: [-7, -7],
      form: { mat: 'cloth', k: R.k, spread: 1.1, rim: R.cfg.rimLight * 0.8 },
    })
    ctx.strokeStyle = pal.hairHi; ctx.lineWidth = 6; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.arc(0, 0, 30, 3.5, 4.8); ctx.stroke()
    ctx.strokeStyle = pal.hairShade; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(2, 4, 20, 0.4, 2.3); ctx.stroke()
  }, Math.max(P.sx, 0.7))
}

function drawPonytailTail(ctx: Ctx, R: Rig): void {
  const { pal } = R
  const A = R.proj(1.15, 0.95, 1.08, true)
  R.at(ctx, A, 0, () => {
    const tail: Build = (c) => {
      c.moveTo(-6, -10); c.bezierCurveTo(36, -6, 74, 40, 52, 112); c.bezierCurveTo(48, 140, 22, 130, 24, 100)
      c.bezierCurveTo(30, 60, 6, 30, -14, 18); c.closePath()
    }
    shadedInk(ctx, tail, {
      base: pal.hair, shade: pal.hairShade, line: pal.lineHair, w: 7, off: [-6, -4],
      form: { mat: 'cloth', k: R.k, spread: 1.25 },
    })
  }, 1)
}

export function drawHairBack(ctx: Ctx, R: Rig): void {
  const { cfg } = R
  if (cfg.headwear === 'hijab') return
  if (cfg.hairStyle === 'bun') drawBun(ctx, R)
  else if (cfg.hairStyle === 'ponytail') drawPonytailTail(ctx, R)
  else if (cfg.hairStyle === 'bob') drawBobBack(ctx, R)
  else if (cfg.hairStyle === 'curly') drawCurlyBack(ctx, R)
}

function drawBuzz(ctx: Ctx, R: Rig, cap: Build): void {
  const { cfg, pal } = R
  const field = fieldFor(R)
  shadedInk(ctx, cap, {
    base: mix(cfg.skin, pal.hair, 0.7), shade: pal.hairShade, line: pal.lineHair, w: 3.5,
    form: { mat: 'cloth', k: R.k, spread: 1.35 },
    hi: field ? () => drawStrandField(ctx, R, field) : undefined,
  })
  if (field) drawHairlineFuzz(ctx, R, hairline(R, BUZZ_LINE), 34)
}

/** The band or tie that gathers the hair; the parting itself comes from the strand field. */
function drawTie(ctx: Ctx, R: Rig): void {
  const { cfg, pal } = R
  if (cfg.hairStyle === 'bun') {
    const P = R.proj(0, 1.3, 1.1)
    R.at(ctx, P, 0, () => ink(ctx, (c) => ellipse(c, 0, 0, 40, 11), { fill: pal.accent, line: pal.lineAccent, w: 5, swell: 0.4 }), Math.max(P.sx, 0.6))
  } else {
    const A = R.proj(1.15, 0.95, 1.08, true)
    R.at(ctx, A, 0, () => ink(ctx, (c) => ellipse(c, 2, 2, 17, 12, 0.5), { fill: pal.accent, line: pal.lineAccent, w: 5, swell: 0.4 }), 1)
  }
}

export function drawHairFront(ctx: Ctx, R: Rig): void {
  const { cfg, pal } = R
  if (cfg.hairStyle === 'none' || cfg.headwear === 'hijab') return
  if (cfg.hairStyle === 'curly') { drawCurlyFront(ctx, R); return }
  const cap = capFor(R)
  if (!cap) return
  if (cfg.hairStyle === 'buzz') { drawBuzz(ctx, R, cap); return }
  const field = fieldFor(R)
  shadedInk(ctx, cap, {
    base: pal.hair, shade: pal.hairShade, line: pal.lineHair, w: 6, off: [-7, -9],
    form: { mat: 'cloth', k: R.k, spread: 1.3, rim: cfg.rimLight * 0.9 },
    hi: () => {
      drawHighlightBand(ctx, R, [[-1.0, 1.0], [-0.55, 1.14], [-0.05, 1.18], [0.5, 1.12]], pal.hairHi)
      if (field) { drawStrandField(ctx, R, field); drawParting(ctx, R, field) }
    },
  })
  if (cfg.hairStyle === 'messy') {
    messyStrands(R).forEach((s) => drawStrand(ctx, R, strandBuild(R, MESSY_LINE, s)))
  }
  if (cfg.hairStyle === 'bun' || cfg.hairStyle === 'ponytail') drawTie(ctx, R)
}
