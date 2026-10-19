/**
 * Facial hair. The beard is a jaw-following mass rather than a disc over the lower face, and the
 * mouth is not a hole punched through it: a lip plate is painted on top of the beard and the
 * mouth is then drawn on that plate, so the lips read as the nearest thing to the viewer. The
 * moustache is a separate form above the plate with a gap of lip showing underneath.
 */
import { measure, merge } from '../bbox'
import { ellipse, mix, rng, smooth, unionInk } from '../draw'
import { formPaint, shadedInk } from '../shade'
import { beardRipple, edgeSeed } from './edge'
import type { Build, Ctx, MouthKind, ProjPt, Pt, Rig, SpherePt } from '../types'

export type FacialHairPhase = 'under' | 'over' | 'gap'

/** Design-space row the lip plate must stay above: the body band it may never disturb is at 372. */
const LIP_FLOOR = 362

/** Mouth latitude on the sphere; a beard pushes it down so the moustache has room above it. */
export function mouthPhi(R: Rig): number {
  const fh = R.cfg.facialHair
  if (fh === 'beard') return -0.84
  return fh === 'moustache' ? -0.78 : -0.66
}

/** Right lobe of the moustache as sphere points; mirrored for the left. */
const LOBE: readonly SpherePt[] = [
  [0.05, -0.37], [0.26, -0.34], [0.5, -0.38], [0.72, -0.5], [0.84, -0.66],
  [0.7, -0.6], [0.48, -0.53], [0.26, -0.52], [0.05, -0.51],
]
const mirror = (list: readonly SpherePt[]): SpherePt[] => list.map(([t, p, d]) => [-t, p, d] as const)

/**
 * Inner (cheek) edge of the beard, left sideburn to right sideburn. It stays high at the ear so
 * the beard joins the hair, then sweeps down under the cheekbone so the cheeks, the blush and
 * the lower lip all stay out of the dark mass.
 */
const BEARD_INNER: readonly SpherePt[] = [
  [-1.45, -0.34], [-1.36, -0.53], [-1.14, -0.71], [-0.82, -0.79], [-0.44, -0.81], [0, -0.79],
  [0.44, -0.81], [0.82, -0.79], [1.14, -0.71], [1.36, -0.53], [1.45, -0.34],
]

/** Where the beard's clumps start; each grows downward from the cheek line toward the jaw. */
const FLOW: readonly (readonly [number, number])[] = [
  [-1.2, -0.48], [-0.95, -0.66], [-0.6, -0.8], [0.6, -0.8], [0.95, -0.66], [1.2, -0.48],
]

/**
 * The beard's own silhouette, a little outside the head. It is widest at the jaw and pulls back
 * in at the chin, where the body band leaves no room to grow: a beard that merely traces the head
 * outline has no shape of its own, and reads as a mask painted on the face.
 */
function beardOuter(R: Rig): Pt[] {
  const out: Pt[] = []
  const n = 28
  const a0 = 0.3, a1 = Math.PI - 0.3
  const wobble = beardRipple(R.cfg)
  for (let i = 0; i <= n; i++) {
    const t = a0 + ((a1 - a0) * i) / n
    const s = 1.125 - 0.082 * Math.sin(t) ** 2
    out.push(R.sil(t, s + wobble(t), 0, 5 * Math.sin(t) ** 3))
  }
  return out
}

/**
 * Inside the beard: the cheek sitting in front of it, then a few clumps running with the growth.
 * The lit side gets the pale clumps and the shadow side the dark ones, which is what stops the
 * mass reading as one flat silhouette.
 */
function drawBeardFlow(c: Ctx, R: Rig, inner: readonly ProjPt[]): void {
  const { pal } = R
  c.strokeStyle = pal.line; c.globalAlpha = 0.26 * Math.min(1, R.k); c.lineWidth = 15; c.lineJoin = 'round'
  c.beginPath(); smooth(c, inner, false); c.stroke()
  c.globalAlpha = 1; c.lineCap = 'round'
  const rnd = rng(edgeSeed(R.cfg) ^ 0x2f1b7c0d)
  for (const [t0, p0] of FLOW) {
    const reach = 0.3 + rnd() * 0.24
    const p = R.pts([[t0, p0], [t0 * 0.98, p0 - reach], [t0 * 0.9, p0 - reach * 2]], 1.05, true)
    if (p.every((q) => q.z < 0.1)) continue
    c.strokeStyle = t0 < 0 ? pal.beardHi : pal.beardShade
    c.lineWidth = t0 < 0 ? 6 : 8
    c.globalAlpha = t0 < 0 ? 0.3 : 0.6
    c.beginPath(); smooth(c, p, false); c.stroke()
  }
  c.globalAlpha = 1
  // The chin ball catches the light even under a beard, which is what keeps the chin readable.
  const chin = R.proj(0, -1.18, 1.0)
  if (chin.z > 0.1) {
    c.fillStyle = pal.beardHi; c.globalAlpha = 0.42
    c.beginPath(); ellipse(c, chin.x, chin.y + 10, 38 * Math.max(chin.sx, 0.4), 22); c.fill()
    c.globalAlpha = 1
  }
}

const LOBES = 19

/**
 * Clumps riding the beard's outer edge. They are unioned into the mass rather than drawn on it,
 * so the beard gets a scalloped silhouette and no internal outlines — the same trick the animals'
 * cheek fur uses. Both the placement and the radius are mirror-symmetric in t, and both shrink
 * toward the chin, where there is no room left above the body band.
 *
 * Each clump is a narrow spindle lying along the surface normal, not a ball sitting on it: round
 * clumps of a soft radius read as wool, and it is the lengthways grain — many fine points all
 * leaning the same way out of the jaw — that reads as hair instead.
 */
function beardLobes(R: Rig): Build[] {
  const a0 = 0.32, a1 = Math.PI - 0.32
  return Array.from({ length: LOBES }, (_, i) => {
    const t = a0 + ((a1 - a0) * i) / (LOBES - 1)
    const low = Math.sin(t) ** 2
    const u = t - Math.PI / 2
    // Longest along the jaw: long points up at the cheek read as a mane, and down at the chin the
    // body band is close underneath. The length alternates, which breaks up the scallop.
    const r = (4 + 8 * Math.sin(Math.PI * Math.abs((2 * u) / Math.PI))) * (0.74 + 0.26 * Math.cos(7 * u))
    const c0 = R.sil(t, 1.125 - 0.082 * low - 0.05, 0, 5 * Math.sin(t) ** 3)
    // Clumps hang out and down along the surface normal rather than sitting on it as discs.
    const rot = Math.atan2((c0.y - R.cy) / R.ry, (c0.x - R.cx) / R.rx)
    return (c: Ctx) => ellipse(c, c0.x, c0.y, r * 1.85, r * 0.42, rot)
  })
}

function drawBeard(ctx: Ctx, R: Rig): void {
  const { pal } = R
  const inner = R.pts(BEARD_INNER, 1.03, true)
  const main: Build = (c) => smooth(c, [...beardOuter(R), ...inner])
  const shapes = [main, ...beardLobes(R)]
  const box = shapes.map(measure).reduce(merge)
  const paint = formPaint(ctx, box, { base: pal.beard, mat: 'cloth', k: R.k, spread: 1.25 })
  unionInk(ctx, shapes, { fill: paint, line: pal.lineBeard, w: 6 })
  ctx.save(); ctx.beginPath(); main(ctx); ctx.clip(); drawBeardFlow(ctx, R, inner); ctx.restore()
}

interface LipBox {
  /** Half-width of the plate. */
  readonly w: number
  /** How far the plate reaches above and below the mouth's own origin. */
  readonly top: number
  readonly bot: number
}

/** The plate has to hold whichever mouth is drawn on it, so each mouth names its own margins. */
const LIP: Readonly<Record<MouthKind, LipBox>> = {
  smile: { w: 42, top: 13, bot: 20 },
  smallsmile: { w: 28, top: 11, bot: 16 },
  tiny: { w: 23, top: 11, bot: 18 },
  wavy: { w: 32, top: 12, bot: 16 },
  o: { w: 26, top: 12, bot: 26 },
  open: { w: 38, top: 14, bot: 30 },
  grin: { w: 49, top: 15, bot: 34 },
}

/** A lip form: a soft cupid's bow on top and a fuller lower lip. */
function lipBuild(box: LipBox, bot: number): Build {
  const { w, top } = box
  return (c) => {
    c.moveTo(-w, -1)
    c.quadraticCurveTo(-w * 0.6, -top, -w * 0.21, -top * 0.6)
    c.quadraticCurveTo(0, -top * 0.28, w * 0.21, -top * 0.6)
    c.quadraticCurveTo(w * 0.6, -top, w, -1)
    c.quadraticCurveTo(w * 0.74, bot, 0, bot)
    c.quadraticCurveTo(-w * 0.74, bot, -w, -1)
    c.closePath()
  }
}

/**
 * The lip plate the mouth is drawn on. Only a beard needs it: without one the surrounding skin
 * already separates the mouth from everything else.
 */
function drawLipPlate(ctx: Ctx, R: Rig): void {
  const { pal } = R
  const box = LIP[R.ex.mouth]
  const P = R.proj(0, mouthPhi(R), 1.08)
  const bot = Math.min(box.bot, LIP_FLOOR - P.y)
  if (P.z < 0.08 || bot < 6) return
  R.at(ctx, P, 0, () => {
    shadedInk(ctx, lipBuild(box, bot), {
      base: mix(pal.skin, pal.blush, 0.2), shade: pal.skinShade, line: pal.lineSkin, w: 4.5,
      off: [-3, -4], form: { mat: 'skin', k: R.k, spread: 1.5 },
    })
  })
}

const TIP_T = 0.84, TIP_P = -0.5

/**
 * How much of a lobe still faces the viewer, found by bisection on its tip. The far lobe is
 * compressed into what is left of the cheek rather than clipped off or dropped: cutting it gives
 * a blunt stub mid-face, and dropping it makes the moustache jump between poses.
 */
function lobeSpan(R: Rig, sign: number): number {
  const front = (s: number): boolean => R.proj(sign * TIP_T * s, TIP_P, 1.1).z > 0.06
  if (front(1)) return 1
  let lo = 0, hi = 1
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2
    if (front(mid)) lo = mid
    else hi = mid
  }
  return lo
}

function drawMoustache(ctx: Ctx, R: Rig): void {
  const { pal } = R
  for (const list of [LOBE, mirror(LOBE)]) {
    const sign = Math.sign((list[4] ?? [1])[0]) || 1
    const span = lobeSpan(R, sign)
    if (span < 0.2) continue
    const p = R.pts(list.map(([t, ph, d]) => [t * span, ph, d] as SpherePt), 1.1, false)
    // A shade lighter than the beard it grows out of, so the two do not fuse where they meet.
    shadedInk(ctx, (c) => smooth(c, p), {
      base: mix(pal.beard, pal.beardHi, 0.45), shade: pal.beardShade, line: pal.lineBeard, w: 5.5, off: [-3, -4],
      form: { mat: 'cloth', k: R.k, spread: 1.6, rim: R.cfg.rimLight * 0.5 },
      hi: (c) => {
        const a = p[3], b = p[1]
        if (!a || !b) return
        c.strokeStyle = pal.beardHi; c.lineWidth = 4.5; c.lineCap = 'round'
        c.beginPath(); c.moveTo(b.x, b.y + 3); c.lineTo(a.x, a.y + 1); c.stroke()
      },
    })
  }
}

function drawStubble(ctx: Ctx, R: Rig): void {
  const { cfg, pal } = R
  const top = R.pts([[-1.6, 0], [-1.3, -0.3], [-0.9, -0.5], [-0.45, -0.5], [0, -0.46], [0.45, -0.5], [0.9, -0.5], [1.3, -0.3], [1.6, 0]], 1.0, true)
  const bot = R.pts([[1.7, -1.5], [0, -1.7], [-1.7, -1.5]], 1.2, true)
  ctx.fillStyle = mix(cfg.skin, pal.hair, 0.4); ctx.globalAlpha = 0.85
  ctx.beginPath(); smooth(ctx, [...top, ...bot]); ctx.fill(); ctx.globalAlpha = 1
  const rnd = rng(7)
  ctx.fillStyle = mix(pal.hairShade, cfg.skin, 0.32)
  for (let i = 0; i < 120; i++) {
    const P = R.proj((rnd() * 2 - 1) * 1.45, -0.5 - rnd() * 0.95, 1.0)
    if (P.z < 0.12) continue
    ctx.beginPath(); ellipse(ctx, P.x, P.y, 1.5 + rnd(), 1.5 + rnd()); ctx.fill()
  }
}

export function drawFacialHair(ctx: Ctx, R: Rig, phase: FacialHairPhase): void {
  const fh = R.cfg.facialHair
  if (fh === 'none' || R.animal) return
  if (phase === 'under' && fh === 'stubble') drawStubble(ctx, R)
  else if (phase === 'over' && fh === 'beard') drawBeard(ctx, R)
  else if (phase === 'gap' && (fh === 'beard' || fh === 'moustache')) {
    if (fh === 'beard') drawLipPlate(ctx, R)
    drawMoustache(ctx, R)
  }
}
