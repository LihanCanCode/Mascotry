import { useCallback, useEffect, useRef, useState } from 'react'

const RESET_MS = 2400

export type CopyState = 'idle' | 'copied' | 'failed'

/**
 * Copy to the clipboard, reporting whether it worked.
 *
 * The result has to be shown rather than assumed: the Clipboard API needs a
 * secure context and a permission that can be refused, and a snippet that
 * silently did not copy is worse than one that says so.
 */
export function useClipboard(): {
  readonly state: CopyState
  readonly copy: (text: string) => Promise<void>
} {
  const [state, setState] = useState<CopyState>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      clearTimeout(timer.current)
    }
  }, [])

  const copy = useCallback(async (text: string): Promise<void> => {
    let ok = false
    try {
      await navigator.clipboard.writeText(text)
      ok = true
    } catch {
      ok = false
    }
    if (!mounted.current) return
    setState(ok ? 'copied' : 'failed')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), RESET_MS)
  }, [])

  return { state, copy }
}
