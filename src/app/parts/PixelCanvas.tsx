import { useEffect, useRef } from 'react'
import type { Pixels } from '../../image/types'

interface PixelCanvasProps {
  readonly image: Pixels
  /** What the drawing shows, for anyone who cannot see it. */
  readonly alt: string
  /** CSS size in pixels. The buffer keeps its own resolution. */
  readonly display: number
  readonly className?: string
}

/**
 * Shows a pixel buffer without turning it into a file first.
 *
 * Nothing in this app is shipped as an image: the thumbnails come out of the
 * studio as raw RGBA and go straight onto a canvas. `putImageData` ignores the
 * canvas transform, so the buffer's own resolution is kept and CSS does the
 * scaling — which also means a retina screen gets the full-resolution draw.
 */
export function PixelCanvas({ image, alt, display, className }: PixelCanvasProps): React.JSX.Element {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (canvas === null) return
    const ctx = canvas.getContext('2d')
    if (ctx === null) return
    ctx.clearRect(0, 0, image.width, image.height)
    ctx.putImageData(new ImageData(new Uint8ClampedArray(image.data), image.width, image.height), 0, 0)
  }, [image])

  return (
    <canvas
      ref={ref}
      width={image.width}
      height={image.height}
      role="img"
      aria-label={alt}
      className={className}
      style={{ width: display, height: display }}
    />
  )
}
