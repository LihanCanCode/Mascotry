// Shared hair geometry: silhouette arcs, hairlines on the face sphere, tapered strand shapes,
// and the strand separations that keep a hair cap from reading as a moulded slab.
import { rng, smooth } from '../draw'
import { shadedInk } from '../shade'
import { edgeSeed } from './edge'
import type { Build, Ctx, Pt, ProjPt, Rig, SpherePt } from '../types'

const TAU = Math.PI * 2
/** Canvas angles of the left / right temple (slightly below horizontal). */
export const L_TEMPLE = Math.PI - 0.2
export const R_TEMPLE = TAU + 0.2

/** Points along the head silhouette from canvas angle a0 to a1; `amps` adds a repeating bump pattern. */
export function arcPts(R: Rig, a0: number, a1: number, n: number, s: number, amps?: readonly number[]): Pt[] {
  const out: Pt[] = []
  for (let i = 0; i <= n; i++) {
    const t = a0 + ((a1 - a0) * i) / n
    const bump = amps && amps.length ? (amps[i % amps.length] ?? 0) : 0
    out.push(R.sil(t, s + bump, 0, -3))
  }
  return out
}

/** Linear interpolation of a hairline's latitude at longitude theta. */
export function linePhi(line: readonly SpherePt[], theta: number): number {
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i] as SpherePt, b = line[i + 1] as SpherePt
    const lo = Math.min(a[0], b[0]), hi = Math.max(a[0], b[0])
    if (theta >= lo && theta <= hi && hi > lo) return a[1] + ((b[1] - a[1]) * (theta - a[0])) / (b[0] - a[0])
  }
  const edge = (theta < 0 ? line[0] : line[line.length - 1]) as SpherePt
  return edge[1]
}

/**
 * Drop a hairline by a palindromic wobble so the fringe edge is a run of clumps rather than one
 * clean curve. The wobble only ever lowers, which keeps the cap covering what it covered before.
 */
export function wobbleLine(line: readonly SpherePt[], amps: readonly number[]): SpherePt[] {
  return line.map(([t, p, d], i) => [t, p - (amps[i] ?? 0), d] as SpherePt)
}

export interface StrandField {
  /** Latitude near the crown that the strands start from. */
  readonly crown: number
  /** The hairline they run down to. */
  readonly line: readonly SpherePt[]
  /** Longitude of the parting; strands sweep away from it. */
  readonly part: number
  readonly count: number
  readonly w: number
}

const shift = (p: readonly Pt[], dx: number, dy: number): Pt[] => p.map((q) => ({ x: q.x + dx, y: q.y + dy }))

/**
 * Strand separations inside a hair cap: each is a curve running from near the parting out to the
 * hairline, drawn as a dark split with a lighter strand beside it. Seeded from the character, so
 * the same config always produces the same head of hair. Call inside the cap's own clip.
 */
export function drawStrandField(ctx: Ctx, R: Rig, f: StrandField): void {
  const rnd = rng(edgeSeed(R.cfg) ^ 0x51ed270b)
  const runs: Pt[][] = []
  for (let i = 0; i < f.count; i++) {
    const end = -1.5 + (3 * (i + 0.5)) / f.count
    const jitter = rnd() * 0.12 - 0.06
    const tip = linePhi(f.line, end)
    // Strands leave the crown already spread out: a fan that all meets at one point reads as a
    // sunburst rather than as hair.
    const p = R.pts([
      [f.part + (end - f.part) * 0.55, f.crown + jitter],
      [f.part + (end - f.part) * 0.8, (f.crown + tip) / 2 + jitter],
      [end, tip + 0.13 + rnd() * 0.08],
    ], 1.05, true)
    if (p.some((q) => q.z >= 0.08)) runs.push(p)
  }
  // Every strand shares a style, so the whole field goes down as one path per tone rather than
  // two strokes each: a dozen extra stroke calls per cell is real time at sheet sizes.
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.strokeStyle = R.pal.hairShade; ctx.lineWidth = f.w; ctx.globalAlpha = 0.6
  ctx.beginPath(); for (const p of runs) smooth(ctx, p, false)
  ctx.stroke()
  ctx.strokeStyle = R.pal.hairHi; ctx.lineWidth = f.w * 0.4; ctx.globalAlpha = 0.4
  ctx.beginPath(); for (const p of runs) smooth(ctx, shift(p, 6, -3), false)
  ctx.stroke(); ctx.globalAlpha = 1
}

/** The parting itself: a deeper split with a lift of light down one side of it. */
export function drawParting(ctx: Ctx, R: Rig, f: StrandField): void {
  const tip = linePhi(f.line, f.part)
  const p = R.pts([[f.part, f.crown], [f.part * 0.96, (f.crown + tip) / 2], [f.part * 0.9, tip + 0.08]], 1.06, true)
  if (p.every((q) => q.z < 0.08)) return
  ctx.lineCap = 'round'
  ctx.strokeStyle = R.pal.hairShade; ctx.lineWidth = f.w * 1.5; ctx.globalAlpha = 0.85
  ctx.beginPath(); smooth(ctx, p, false); ctx.stroke()
  ctx.strokeStyle = R.pal.hairHi; ctx.lineWidth = f.w * 0.7; ctx.globalAlpha = 0.5
  ctx.beginPath(); smooth(ctx, shift(p, 8, 0), false); ctx.stroke()
  ctx.globalAlpha = 1
}

/**
 * A fringe of cropped hair sitting on the skin just under the hairline. A buzz cut has no edge
 * to speak of — a hard line round the scalp reads as a swimming cap — so the edge is dissolved
 * into short ticks instead.
 */
export function drawHairlineFuzz(ctx: Ctx, R: Rig, line: readonly SpherePt[], count: number): void {
  const rnd = rng(edgeSeed(R.cfg) ^ 0x1c9e3b77)
  // Three weights, one stroke each, rather than one stroke per tick.
  const bands: Pt[][][] = [[], [], []]
  for (let i = 0; i < count; i++) {
    const t = -1.46 + (2.92 * (i + 0.5)) / count
    const phi = linePhi(line, t)
    const a = R.proj(t, phi + 0.03, 1.04, true)
    const b = R.proj(t, phi - 0.06 - rnd() * 0.07, 1.04, true)
    const band = bands[Math.min(2, Math.floor(rnd() * 3))]
    if (a.z >= 0.1 && band) band.push([a, b])
  }
  ctx.strokeStyle = R.pal.hairShade; ctx.lineCap = 'round'
  bands.forEach((band, i) => {
    if (!band.length) return
    ctx.globalAlpha = 0.3 + i * 0.2; ctx.lineWidth = 2.5 + i
    ctx.beginPath()
    for (const [a, b] of band) { if (a && b) { ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y) } }
    ctx.stroke()
  })
  ctx.globalAlpha = 1
}

export interface Strand {
  readonly t: number
  readonly w: number
  readonly tipT: number
  readonly tipP: number
}

/** A tapered lock: wide at the hairline root, pointed at the tip, slightly convex sides. */
export function strandBuild(R: Rig, line: readonly SpherePt[], s: Strand, bulge = 5): Build {
  const rootPhi = linePhi(line, s.t) + 0.1
  const L = R.proj(s.t - s.w, rootPhi, 1.04, true)
  const Rr = R.proj(s.t + s.w, rootPhi, 1.04, true)
  const T = R.proj(s.tipT, s.tipP, 1.05, true)
  const m: Pt = { x: (L.x + Rr.x) / 2, y: (L.y + Rr.y) / 2 }
  const ax = T.x - m.x, ay = T.y - m.y
  const len = Math.hypot(ax, ay) || 1
  const px = -ay / len, py = ax / len
  const ctl = (E: ProjPt): Pt => {
    const sign = Math.sign(px * (E.x - m.x) + py * (E.y - m.y)) || 1
    return { x: (E.x + T.x) / 2 + px * bulge * sign, y: (E.y + T.y) / 2 + py * bulge * sign }
  }
  const c1 = ctl(L), c2 = ctl(Rr)
  return (c) => {
    c.moveTo(L.x, L.y); c.quadraticCurveTo(c1.x, c1.y, T.x, T.y)
    c.quadraticCurveTo(c2.x, c2.y, Rr.x, Rr.y); c.closePath()
  }
}

/** Fill + outline a lock with a soft darker lower-right edge. */
export function drawStrand(ctx: Ctx, R: Rig, build: Build, w = 4.5): void {
  const { pal } = R
  shadedInk(ctx, build, {
    base: pal.hair, shade: pal.hairShade, line: pal.lineHair, w, off: [-3, -4],
    form: { mat: 'cloth', k: R.k, spread: 1.6 },
  })
}

/** Soft light band across the crown: a wide translucent stroke plus a thin bright core. */
export function drawHighlightBand(ctx: Ctx, R: Rig, band: readonly SpherePt[], color: string): void {
  const p = R.pts(band, 1.06, true)
  if (p.every((q) => q.z < 0.1)) return
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = color
  ctx.globalAlpha = 0.5; ctx.lineWidth = 17
  ctx.beginPath(); p.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.stroke()
  ctx.globalAlpha = 0.9; ctx.lineWidth = 5
  ctx.beginPath(); p.forEach((q, i) => (i ? ctx.lineTo(q.x + 2, q.y - 5) : ctx.moveTo(q.x + 2, q.y - 5))); ctx.stroke()
  ctx.globalAlpha = 1
}
