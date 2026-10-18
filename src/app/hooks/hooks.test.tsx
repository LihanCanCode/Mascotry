// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { useBlobUrls } from './useBlobUrls'
import { useClipboard } from './useClipboard'
import { useNearViewport } from './useNearViewport'
import { applyStoredTheme, useTheme } from './useTheme'

function setMedia(dark: boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: dark && query.includes('dark'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

describe('useTheme', () => {
  beforeEach(() => setMedia(false))

  it('follows the system until a choice is made', () => {
    setMedia(true)
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })

  it('remembers a choice and applies it to the document', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.toggle())
    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem('mascotry.theme')).toBe('dark')
  })

  it('toggles back again', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.toggle())
    act(() => result.current.toggle())
    expect(result.current.theme).toBe('light')
  })

  it('starts from what was stored last time', () => {
    localStorage.setItem('mascotry.theme', 'dark')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
  })

  it('ignores a stored value that is not a theme', () => {
    localStorage.setItem('mascotry.theme', 'turquoise')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
  })

  it('still toggles when storage is unavailable', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage disabled')
    })
    const { result } = renderHook(() => useTheme())
    act(() => result.current.toggle())
    expect(result.current.theme).toBe('dark')
    setItem.mockRestore()
  })

  it('applies a stored theme before React is involved', () => {
    localStorage.setItem('mascotry.theme', 'dark')
    applyStoredTheme()
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('leaves the document alone when nothing was stored', () => {
    applyStoredTheme()
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })
})

describe('useBlobUrls', () => {
  const created: string[] = []
  const revoked: string[] = []

  // Only the two methods are replaced. Standing in for the whole `URL` global
  // would take the constructor with it, which the test runner itself needs.
  beforeEach(() => {
    created.length = 0
    revoked.length = 0
    URL.createObjectURL = (blob: Blob): string => {
      const url = `blob:${created.length}:${blob.size}`
      created.push(url)
      return url
    }
    URL.revokeObjectURL = (url: string): void => {
      revoked.push(url)
    }
  })

  /**
   * Built once and reused. The hook keys its effect on the object's identity,
   * so handing it a freshly built pair on every render would make it rebuild
   * the URLs forever — which is why the app passes the pair straight off the
   * reducer state rather than assembling one in the render body.
   */
  const pair = (tag: string): { directions: Blob; reactions: Blob } => ({
    directions: new Blob([tag]),
    reactions: new Blob([tag, tag]),
  })
  const first = pair('a')
  const second = pair('b')

  it('hands back nothing when there is nothing to show', () => {
    const { result } = renderHook(() => useBlobUrls(null))
    expect(result.current).toBeNull()
  })

  it('makes one URL per sheet', () => {
    const { result } = renderHook(() => useBlobUrls(first))
    expect(result.current?.directions).toBe(created[0])
    expect(result.current?.reactions).toBe(created[1])
  })

  it('releases the old pair as soon as a new one arrives', () => {
    const { result, rerender } = renderHook((props: { blobs: ReturnType<typeof pair> | null }) =>
      useBlobUrls(props.blobs), { initialProps: { blobs: first } })
    const before = result.current

    rerender({ blobs: second })

    expect(revoked).toEqual([before?.directions, before?.reactions])
    expect(result.current?.directions).not.toBe(before?.directions)
  })

  it('stops holding anything when the sheets go away', () => {
    const { result, rerender } = renderHook((props: { blobs: ReturnType<typeof pair> | null }) =>
      useBlobUrls(props.blobs), { initialProps: { blobs: first as ReturnType<typeof pair> | null } })
    rerender({ blobs: null })
    expect(result.current).toBeNull()
  })

  it('releases everything on unmount', () => {
    const { result, unmount } = renderHook(() => useBlobUrls(first))
    const urls = result.current
    unmount()
    expect(revoked).toEqual([urls?.directions, urls?.reactions])
  })
})

describe('useClipboard', () => {
  it('starts idle', () => {
    const { result } = renderHook(() => useClipboard())
    expect(result.current.state).toBe('idle')
  })

  it('reports a successful copy and settles back to idle', async () => {
    vi.useFakeTimers()
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const { result } = renderHook(() => useClipboard())

    await act(async () => {
      await result.current.copy('hello')
    })
    expect(result.current.state).toBe('copied')

    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current.state).toBe('idle')
  })

  it('reports a refusal rather than pretending it worked', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('no')) } })
    const { result } = renderHook(() => useClipboard())

    await act(async () => {
      await result.current.copy('hello')
    })
    expect(result.current.state).toBe('failed')
  })

  it('does not set state after it has been unmounted', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
    const { result, unmount } = renderHook(() => useClipboard())
    const copy = result.current.copy
    unmount()
    await expect(copy('hello')).resolves.toBeUndefined()
  })
})

describe('useNearViewport', () => {
  it('treats everything as near when there is no observer to ask', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const ref = { current: document.createElement('div') }
    const { result } = renderHook(() => useNearViewport(ref))
    expect(result.current).toBe(true)
  })

  it('turns true once the element comes into range, and stops watching', async () => {
    let fire: ((entries: { isIntersecting: boolean }[]) => void) | null = null
    const disconnect = vi.fn()
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
        fire = callback
      }
      observe = vi.fn()
      disconnect = disconnect
    })

    const ref = { current: document.createElement('div') }
    const { result } = renderHook(() => useNearViewport(ref))
    expect(result.current).toBe(false)

    act(() => fire?.([{ isIntersecting: true }]))

    await waitFor(() => expect(result.current).toBe(true))
    expect(disconnect).toHaveBeenCalled()
  })

  it('stays false while the element is still out of range', () => {
    let fire: ((entries: { isIntersecting: boolean }[]) => void) | null = null
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
        fire = callback
      }
      observe = vi.fn()
      disconnect = vi.fn()
    })

    const ref = { current: document.createElement('div') }
    const { result } = renderHook(() => useNearViewport(ref))
    act(() => fire?.([{ isIntersecting: false }]))
    expect(result.current).toBe(false)
  })
})
