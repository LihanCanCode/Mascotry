import { useEffect, useState, type RefObject } from 'react'

/** Start drawing a little before the card is on screen, so it is never caught blank. */
const MARGIN = '400px'

/**
 * True once the element has come within a screenful of the viewport, and true
 * from then on. Fourteen characters is fourteen canvas renders, and scrolling
 * past them all at once is the one moment the app can stutter, so each card
 * waits its turn. Where there is no IntersectionObserver, everything is treated
 * as near and simply draws.
 */
export function useNearViewport(ref: RefObject<Element | null>): boolean {
  const [near, setNear] = useState(typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const element = ref.current
    if (near || element === null) return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true)
          observer.disconnect()
        }
      },
      { rootMargin: MARGIN },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [near, ref])

  return near
}
