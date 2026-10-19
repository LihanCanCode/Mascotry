/**
 * Geometry shared by every piece of headwear: the dome that sits on the skull, the rings that
 * become brims, and the tone kit each hat is painted with. Keeping these here is what lets a
 * straw hat and a hard hat disagree about everything except how they meet the head.
 */
import { TAU, smooth } from '../draw'
import type { Build, Ctx, Pt, Rig, SpherePt } from '../types'
import { L_TEMPLE, R_TEMPLE, arcPts } from './hairGeometry'

/** Latitude the cap's band sits at; high enough to leave the brim a band of forehead to sit on. */
export const CAP_BAND = 0.78

/** Sphere points across the front of the head at one latitude, with an optional sag at the sides. */
export const edgeList = (phi: number, wobble = 0): SpherePt[] => {
  const out: SpherePt[] = []
  for (let t = -1.55; t <= 1.56; t += 0.2) out.push([t, phi + wobble * Math.cos(t * 2)])
  return out
}

/**
 * A full ring of the head sphere at one latitude. Unlike `edgeList` it closes round the back, so
 * it projects to the complete ellipse a brim needs rather than to the front arc alone.
 */
export function ringPts(R: Rig, phi: number, depth: number, n = 40): Pt[] {
  return Array.from({ length: n }, (_, i) => R.proj(-Math.PI + (TAU * i) / n, phi, depth))
}

export interface DomeSpec {
  /** How far outside the head silhouette the crown arc runs. */
  readonly crown: number
  /** Latitude of the lower edge where the dome meets the forehead. */
  readonly band: number
  /** Depth of that lower edge; above 1 pushes it outside the skull. */
  readonly depth?: number
  /**
   * Radians trimmed off each end of the crown arc. Negative reaches past the temples, which is
   * what a cap or a helmet does; a positive trim keeps the crown up on the skull, which is what
   * a hat with its own brim needs so the crown does not hang down beside the face.
   */
  readonly trim?: number
  /** Sag of the lower edge toward the temples. */
  readonly wobble?: number
}

/** The classic cap/beanie silhouette: an arc over the top closed by a hairline-parallel edge. */
export function domeBuild(R: Rig, spec: DomeSpec): Build {
  const trim = spec.trim ?? -0.08
  const outer = arcPts(R, L_TEMPLE + trim, R_TEMPLE - trim, 16, spec.crown)
  const lower = R.pts(edgeList(spec.band, spec.wobble ?? 0), spec.depth ?? 1.04, true)
  const all = [...outer, ...lower.slice().reverse()]
  return (c) => smooth(c, all)
}

export interface Plate {
  /** Height of the disc above the head's centre, in head radii. */
  readonly h: number
  /** Radius of the disc, in head radii. */
  readonly r: number
  /** Radius where the disc meets the crown it springs from. */
  readonly inner: number
  /** Drawn depth of the disc. See below for why it cannot simply be projected. */
  readonly drop: number
}

/**
 * A brim is a flat horizontal disc, and an orthographic projection of one is a line: every point
 * of a circle at one height has the same height. That is literally what the first straw hat drew,
 * a stick through the head. So the near half of the disc is pushed down and the far half up, by an
 * amount that fades out as the head pitches and the rotation opens the ellipse honestly.
 */
function platePts(R: Rig, h: number, rho: number, drop: number, n = 44): Pt[] {
  const d = Math.hypot(h, rho) || 1
  const phi = Math.atan2(h, rho)
  const k = drop * (1 - 0.72 * Math.abs(R.dy))
  return Array.from({ length: n }, (_, i) => {
    const P = R.proj(-Math.PI + (TAU * i) / n, phi, d)
    return { x: P.x, y: P.y + (k * P.z) / d }
  })
}

/** The disc with its middle cut out, ready to be filled evenodd round the crown. */
export function brimPlate(R: Rig, p: Plate): Build {
  const outer = platePts(R, p.h, p.r, p.drop)
  const inner = platePts(R, p.h, p.inner, (p.drop * p.inner) / p.r).reverse()
  return (c) => { smooth(c, outer); smooth(c, inner) }
}

/** The disc's own outline, for the cast shadow it throws on the face. */
export const plateDisc = (R: Rig, p: Plate): Build => (c) => smooth(c, platePts(R, p.h, p.r, p.drop))

/** Stroke a short run of sphere points; used for seams, gathers and straps. */
export function strokeSpherePath(ctx: Ctx, R: Rig, list: readonly SpherePt[], depth: number): void {
  ctx.beginPath(); smooth(ctx, R.pts(list, depth, true), false); ctx.stroke()
}

export interface HatKit {
  readonly base: string
  readonly shade: string
  readonly hi: string
  readonly line: string
}

/** The hat tones, already derived on the palette, gathered under one name. */
export const hatKit = (R: Rig): HatKit =>
  ({ base: R.pal.hat, shade: R.pal.hatShade, hi: R.pal.hatHi, line: R.pal.lineHat })
