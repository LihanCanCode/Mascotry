/**
 * Silhouette texture. A perfectly smooth curve reads as moulded plastic, so a furred head gets a
 * fine ripple along its outline and hair caps get a coarser one. Both come from the seeded PRNG
 * and both are built from even harmonics only, which makes them exactly mirror-symmetric about
 * the vertical axis — so the forward-facing cell stays symmetric and output stays reproducible.
 */
import { rng } from '../draw'
import type { StudioConfig } from '../types'

/** A stable seed per character: same config, same texture, whatever the pose. */
export function edgeSeed(cfg: StudioConfig): number {
  const key = `${cfg.ears}|${cfg.skin}|${cfg.faceShape}|${cfg.hairStyle}`
  let h = 0x811c9dc5
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 0x01000193)
  return h >>> 0
}

/** Harmonic orders of the fur ripple; all even, so cos(n(PI - t)) === cos(n t). */
const ORDERS: readonly number[] = [6, 10, 14, 18, 24]
const FUR_AMP = 0.03

/**
 * Radial ripple as a fraction of the head radius, for a canvas angle t. The amplitude fades out
 * toward the chin so the jaw stays clean and the body band below it is never touched.
 */
export function furRipple(cfg: StudioConfig, isFur: boolean): (t: number) => number {
  if (!isFur || cfg.edgeTexture <= 0) return () => 0
  const rnd = rng(edgeSeed(cfg))
  const gains = ORDERS.map(() => rnd() - 0.5)
  const scale = (FUR_AMP * cfg.edgeTexture) / ORDERS.length
  return (t: number) => {
    let v = 0
    for (let i = 0; i < ORDERS.length; i++) v += (gains[i] ?? 0) * Math.cos((ORDERS[i] ?? 0) * t)
    const chin = Math.max(0, Math.sin(t))
    return v * scale * (1 - chin * chin)
  }
}

/**
 * Harmonic orders of the beard ripple. A beard breaks into a handful of clumps rather than
 * thousands of hairs, so these are coarser than the fur orders; all even, which keeps the ripple
 * mirror-symmetric about the vertical axis.
 */
const BEARD_ORDERS: readonly number[] = [4, 8, 12]
const BEARD_AMP = 0.16

/**
 * Radial ripple for the beard's outer edge, as a fraction of the head radius. It fades to nothing
 * at the lowest point of the chin, which keeps the beard clear of the body band below it.
 */
export function beardRipple(cfg: StudioConfig): (t: number) => number {
  if (cfg.edgeTexture <= 0) return () => 0
  const rnd = rng(edgeSeed(cfg) ^ 0x5bf03635)
  const gains = BEARD_ORDERS.map(() => rnd() - 0.5)
  const scale = (BEARD_AMP * cfg.edgeTexture) / BEARD_ORDERS.length
  return (t: number) => {
    let v = 0
    for (let i = 0; i < BEARD_ORDERS.length; i++) v += (gains[i] ?? 0) * Math.cos((BEARD_ORDERS[i] ?? 0) * t)
    const chin = Math.max(0, Math.sin(t))
    return v * scale * (1 - chin ** 4)
  }
}

/**
 * A palindromic ripple for a hair cap's silhouette arc, so hair edges are not perfect ellipses.
 * Mirrored about the middle sample, which is what keeps the centred cell symmetric.
 */
export function hairWobble(n: number, seed: number, amp: number): number[] {
  const rnd = rng(seed ^ 0x9e3779b9)
  const half = Math.ceil((n + 1) / 2)
  const left = Array.from({ length: half }, () => rnd() * amp)
  return Array.from({ length: n + 1 }, (_, i) => left[Math.min(i, n - i)] ?? 0)
}
