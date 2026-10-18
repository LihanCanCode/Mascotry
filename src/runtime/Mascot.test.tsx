// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Mascot } from './Mascot'
import { cellPosition } from './aim'
import { DIZZY_CELL, STREAK_FOR_DIZZY } from './poke'

const POSES = '/poses.webp'
const MOODS = '/moods.webp'

function setMedia(matches: (query: string) => boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: matches(query),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
}

function movePointer(x: number, y: number): void {
  act(() => {
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: x, clientY: y }))
  })
}

function layers(): HTMLElement[] {
  const button = screen.getByRole('button')
  return Array.from(button.querySelectorAll('span'))
}

/** Pretend the mascot sits at 100,100 and is 100px square. */
function placeMascot(): void {
  const button = screen.getByRole('button')
  button.getBoundingClientRect = () =>
    ({ left: 100, top: 100, width: 100, height: 100, right: 200, bottom: 200, x: 100, y: 100 }) as DOMRect
}

beforeEach(() => {
  setMedia((q) => q.includes('hover'))
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0)
    return 1
  })
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('Mascot', () => {
  it('names itself for screen readers', () => {
    render(<Mascot directions={POSES} reactions={MOODS} label="Pip" />)
    expect(screen.getByRole('button', { name: 'Poke the Pip' })).toBeTruthy()
  })

  it('starts looking straight ahead', () => {
    render(<Mascot directions={POSES} reactions={MOODS} />)
    expect(layers()[0]?.style.backgroundPosition).toBe(cellPosition(4))
  })

  it('renders at the requested size', () => {
    render(<Mascot directions={POSES} reactions={MOODS} size={200} />)
    expect(screen.getByRole('button').style.width).toBe('200px')
  })

  it('turns toward the pointer', () => {
    render(<Mascot directions={POSES} reactions={MOODS} />)
    placeMascot()
    movePointer(500, 150)
    expect(layers()[0]?.style.backgroundPosition).toBe(cellPosition(5))
    movePointer(150, 500)
    expect(layers()[0]?.style.backgroundPosition).toBe(cellPosition(7))
  })

  it('stays straight ahead while the pointer is close', () => {
    render(<Mascot directions={POSES} reactions={MOODS} />)
    placeMascot()
    movePointer(158, 152)
    expect(layers()[0]?.style.backgroundPosition).toBe(cellPosition(4))
  })

  it('ignores the pointer on touch-only devices', () => {
    setMedia(() => false)
    render(<Mascot directions={POSES} reactions={MOODS} />)
    placeMascot()
    movePointer(900, 100)
    expect(layers()[0]?.style.backgroundPosition).toBe(cellPosition(4))
  })

  it('shows a mood when poked, then puts it away', () => {
    vi.useFakeTimers()
    render(<Mascot directions={POSES} reactions={MOODS} />)
    fireEvent.pointerDown(screen.getByRole('button'))
    expect(layers()[1]?.style.opacity).toBe('1')
    act(() => vi.advanceTimersByTime(2000))
    expect(layers()[1]?.style.opacity).toBe('0')
  })

  it('goes dizzy when poked repeatedly', () => {
    vi.useFakeTimers()
    render(<Mascot directions={POSES} reactions={MOODS} />)
    const button = screen.getByRole('button')
    for (let i = 0; i < STREAK_FOR_DIZZY; i++) {
      fireEvent.pointerDown(button)
      act(() => vi.advanceTimersByTime(50))
    }
    expect(layers()[1]?.style.backgroundPosition).toBe(cellPosition(DIZZY_CELL))
  })

  it('skips the squash when reduced motion is asked for', () => {
    render(<Mascot directions={POSES} reactions={MOODS} />)
    const button = screen.getByRole('button')
    setMedia((q) => q.includes('reduced-motion'))
    fireEvent.pointerDown(button)
    expect(button.style.transform).toBe('scale(1, 1)')
  })

  it('escapes quotes in sheet URLs', () => {
    render(<Mascot directions={'a".webp'} reactions={MOODS} />)
    expect(layers()[0]?.style.backgroundImage).toContain('\\"')
  })

  it('stops listening once unmounted', () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(<Mascot directions={POSES} reactions={MOODS} />)
    unmount()
    expect(remove).toHaveBeenCalledWith('pointermove', expect.any(Function))
  })
})
