/**
 * The hood. It matters more than the other headwear because it is the only piece that frames the
 * face: a shell behind the skull, an opening cut lower on the brow than a headscarf's, and a deep
 * shadow thrown down from that opening. Everything the hacker reads as comes from those three.
 */
import { TAU, mix, smooth } from '../draw'
import { occlude, shadedInk } from '../shade'
import type { Build, Ctx, Rig, SpherePt } from '../types'
import { hatKit, strokeSpherePath } from './headwearShape'

/**
 * The opening. It sits low across the brow and wide at the cheeks, which is what makes a hood a
 * hood: a window the same height as the face reads as a headscarf, and one any lower hides the
 * eyes the character needs.
 */
const HOOD_WINDOW: readonly SpherePt[] = [
  [0, 0.86], [0.58, 0.78], [1.06, 0.52], [1.36, 0.08], [1.42, -0.46], [1.24, -0.96], [0.68, -1.3], [0, -1.42],
  [-0.68, -1.3], [-1.24, -0.96], [-1.42, -0.46], [-1.36, 0.08], [-1.06, 0.52], [-0.58, 0.78],
]

/**
 * The shell. It is taller than the head and narrower at the sides, which is the difference
 * between a hood and a diving helmet: a shape that merely scales the skull up reads as a bubble.
 */
function shellPts(R: Rig): readonly { x: number; y: number }[] {
  const N = 52
  return Array.from({ length: N }, (_, i) => {
    const t = (i / N) * TAU
    const up = Math.max(0, -Math.sin(t))
    const low = Math.max(0, Math.sin(t))
    return R.sil(t, 1.17 + 0.22 * up ** 1.4 - 0.21 * low ** 1.4, 0, 14 * (1 - low ** 2))
  })
}

const shellBuild = (R: Rig): Build => (c) => smooth(c, shellPts(R))

/** Shell with the opening punched out of it; filled evenodd so the face shows through. */
const frameBuild = (R: Rig): Build => (c) => {
  smooth(c, shellPts(R))
  smooth(c, R.pts(HOOD_WINDOW, 1.0, true))
}

/** The part of the shell that is behind the head, painted before the skull goes down. */
export function drawHoodBack(ctx: Ctx, R: Rig): void {
  const kit = hatKit(R)
  shadedInk(ctx, shellBuild(R), {
    base: mix(kit.base, kit.shade, 0.45), shade: kit.shade, line: kit.line, w: 7, off: [-7, -8],
    form: { mat: 'cloth', k: R.k, spread: 1.1, rim: R.cfg.rimLight * 0.4 },
  })
}

/**
 * The arc of the opening that overhangs the eyes, closed off above the head so that pushing it
 * downward shades the brow instead of outlining it.
 */
function browBuild(R: Rig): Build {
  const arc = R.pts([...HOOD_WINDOW.slice(11), ...HOOD_WINDOW.slice(0, 4)], 1.0, true)
  const first = arc[0], last = arc[arc.length - 1]
  if (!first || !last) return () => undefined
  return (c) => {
    smooth(c, arc, false)
    c.lineTo(last.x, -240); c.lineTo(first.x, -240); c.closePath()
  }
}

/**
 * The shadow the opening throws. A soft line all the way round the rim seats the cloth on the
 * face, and the overhang above the brow then casts down across the eyes, which is the whole
 * reason the hacker is lit from a screen rather than from the sky.
 */
export function drawHoodCastShadow(ctx: Ctx, R: Rig): void {
  const k = Math.min(1, R.k || 1)
  ctx.save()
  ctx.strokeStyle = R.pal.skinDeep; ctx.globalAlpha = 0.38 * k; ctx.lineWidth = 26; ctx.lineJoin = 'round'
  ctx.beginPath(); smooth(ctx, R.pts(HOOD_WINDOW, 1.0, true)); ctx.stroke()
  ctx.restore()
  // Cloth close to the skin tints what it shades, so the shade is pulled toward the hood itself.
  const cast = mix(R.pal.skinDeep, R.pal.hat, 0.4)
  // Held just inside the silhouette: a shadow this heavy reaching the antialiased rim would make
  // the edge pixels depend on what is behind the character, and the key has to stay clean.
  ctx.save(); ctx.beginPath(); R.head(ctx, 0.96); ctx.clip()
  occlude(ctx, browBuild(R), { color: cast, alpha: 0.92 * k, dx: 0, dy: 90, steps: 8 })
  ctx.restore()
}

/** The rim of the opening, drawn over the face so the cloth reads as being in front of the brow. */
export function drawHoodFront(ctx: Ctx, R: Rig): void {
  const kit = hatKit(R)
  shadedInk(ctx, frameBuild(R), {
    base: kit.base, shade: kit.shade, line: kit.line, w: 7, off: [-7, -8], rule: 'evenodd',
    form: { mat: 'cloth', k: R.k, spread: 1.15, rim: R.cfg.rimLight * 0.9 },
    hi: (c) => {
      c.lineCap = 'round'; c.lineJoin = 'round'
      c.strokeStyle = kit.hi; c.globalAlpha = 0.6; c.lineWidth = 9
      strokeSpherePath(c, R, [[-1.25, 0.85], [-0.7, 1.15], [-0.1, 1.28]], 1.22)
      c.strokeStyle = kit.shade; c.globalAlpha = 0.85; c.lineWidth = 6
      strokeSpherePath(c, R, [[1.1, 0.8], [1.42, 0.1], [1.46, -0.7]], 1.2)
      strokeSpherePath(c, R, [[-1.1, 0.8], [-1.42, 0.1], [-1.46, -0.7]], 1.2)
      c.globalAlpha = 1
    },
  })
}
