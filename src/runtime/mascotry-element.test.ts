// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MASCOTRY_TAG, defineMascotryElement } from './mascotry-element'
import { CENTRE_CELL, aimCell, cellPosition, normaliseSettings } from './aim'
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

interface Mounted {
  readonly host: HTMLElement
  readonly button: HTMLButtonElement
  readonly poses: HTMLElement
  readonly moods: HTMLElement
}

function mount(attributes: Readonly<Record<string, string>> = {}): Mounted {
  const host = document.createElement(MASCOTRY_TAG)
  for (const [name, value] of Object.entries({ directions: POSES, reactions: MOODS, ...attributes })) {
    host.setAttribute(name, value)
  }
  document.body.append(host)
  const root = host.shadowRoot
  if (root === null) throw new Error('the element did not attach a shadow root')
  const button = root.querySelector('button')
  const layers = root.querySelectorAll('span')
  const poses = layers[0]
  const moods = layers[1]
  if (button === null || poses === undefined || moods === undefined) {
    throw new Error('the element did not build its shadow tree')
  }
  // Pretend it sits at 100,100 and is 100px square.
  host.getBoundingClientRect = () =>
    ({ left: 100, top: 100, width: 100, height: 100, right: 200, bottom: 200, x: 100, y: 100 }) as DOMRect
  return { host, button, poses: poses as HTMLElement, moods: moods as HTMLElement }
}

function movePointer(x: number, y: number): void {
  window.dispatchEvent(new MouseEvent('pointermove', { clientX: x, clientY: y }))
}

function pokeIt(button: HTMLButtonElement): void {
  button.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
}

beforeEach(() => {
  setMedia((query) => query.includes('hover'))
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0)
    return 1
  })
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})

afterEach(() => {
  document.body.replaceChildren()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('defineMascotryElement', () => {
  it('has already registered the tag on import', () => {
    expect(customElements.get(MASCOTRY_TAG)).toBeDefined()
  })

  it('can be called again without throwing, so two copies on a page are harmless', () => {
    expect(() => {
      defineMascotryElement()
      defineMascotryElement()
    }).not.toThrow()
  })
})

describe('mascotry-mascot: structure', () => {
  it('keeps its whole interface inside a shadow root', () => {
    const { host } = mount()
    expect(host.shadowRoot).not.toBeNull()
    expect(host.childNodes.length).toBe(0)
  })

  it('is a single button a keyboard can reach', () => {
    const { button } = mount()
    expect(button.tagName).toBe('BUTTON')
    expect(button.type).toBe('button')
  })

  it('names itself for screen readers from the label attribute', () => {
    const { button } = mount({ label: 'Pip' })
    expect(button.getAttribute('aria-label')).toBe('Poke the Pip')
  })

  it('falls back to a generic name with no label', () => {
    expect(mount().button.getAttribute('aria-label')).toBe('Poke the mascot')
  })

  it('hides both sprite layers from assistive technology', () => {
    const { poses, moods } = mount()
    expect(poses.getAttribute('aria-hidden')).toBe('true')
    expect(moods.getAttribute('aria-hidden')).toBe('true')
  })

  it('points each layer at the sheet it was given', () => {
    const { poses, moods } = mount()
    expect(poses.style.backgroundImage).toContain(POSES)
    expect(moods.style.backgroundImage).toContain(MOODS)
  })

  it('cannot have another declaration smuggled in through a sheet URL', () => {
    const { poses } = mount({ directions: 'a");color:red;background-image:url("b' })
    expect(poses.style.color).toBe('')
    expect(poses.getAttribute('style')).not.toContain('color')
  })

  /**
   * Under a strict CSP, `style-src 'self'` blocks a `<style>` element's text and
   * a style attribute that arrived in parsed HTML. It does not block the CSSOM.
   * So the rule the element has to keep is: no stylesheet text anywhere, only
   * `insertRule` or a constructed sheet.
   */
  it('never writes stylesheet text, which a strict CSP would block', () => {
    const { host } = mount()
    const root = host.shadowRoot as ShadowRoot
    for (const tag of Array.from(root.querySelectorAll('style'))) {
      expect(tag.textContent).toBe('')
    }
    expect(root.innerHTML).not.toContain('{')
  })

  it('still gets its rules in, by a constructed sheet or by insertRule', () => {
    const { host } = mount()
    const root = host.shadowRoot as ShadowRoot
    const adopted = root.adoptedStyleSheets ?? []
    const inserted = Array.from(root.querySelectorAll('style'))
      .reduce((total, tag) => total + (tag.sheet?.cssRules.length ?? 0), 0)
    expect(adopted.length + inserted).toBeGreaterThan(0)
  })
})

describe('mascotry-mascot: attributes', () => {
  it('starts at the default size and takes a new one live', () => {
    const { host } = mount()
    expect(host.style.width).toBe('128px')
    host.setAttribute('size', '200')
    expect(host.style.width).toBe('200px')
    expect(host.style.height).toBe('200px')
  })

  it('ignores a size that is not a usable number', () => {
    const { host } = mount({ size: 'enormous' })
    expect(host.style.width).toBe('128px')
  })

  it('clamps an absurd size instead of trying to draw it', () => {
    const { host } = mount({ size: '99999' })
    expect(Number.parseInt(host.style.width, 10)).toBeLessThanOrEqual(1024)
  })

  it('swaps a sheet when the attribute changes', () => {
    const { host, poses } = mount()
    host.setAttribute('directions', '/other.webp')
    expect(poses.style.backgroundImage).toContain('/other.webp')
  })

  it('renames itself when the label changes', () => {
    const { host, button } = mount({ label: 'Pip' })
    host.setAttribute('label', 'Otter')
    expect(button.getAttribute('aria-label')).toBe('Poke the Otter')
  })
})

describe('mascotry-mascot: watching the pointer', () => {
  it('starts looking straight ahead', () => {
    expect(mount().poses.style.backgroundPosition).toBe(cellPosition(CENTRE_CELL))
  })

  /**
   * The point of this test: the element and the React component must agree, so
   * the element calls the same `aimCell` rather than carrying its own copy of
   * the quantising. Sweeping the pointer over a grid of offsets and replaying
   * the same offsets through `aimCell` directly is what proves it.
   */
  it('matches aimCell exactly across a sweep of pointer offsets', () => {
    const { poses } = mount()
    const settings = normaliseSettings({})
    const offsets = [-220, -120, -60, -47, -46, -45, -31, -30, -29, 0, 29, 30, 31, 45, 46, 47, 60, 120, 220]
    let expected = CENTRE_CELL

    for (const dy of offsets) {
      for (const dx of offsets) {
        movePointer(150 + dx, 150 + dy)
        expected = aimCell(dx, dy, expected, settings)
        expect(poses.style.backgroundPosition, `offset ${dx},${dy}`).toBe(cellPosition(expected))
      }
    }
  })

  it('honours a widened commit distance from the attribute', () => {
    const { poses } = mount({ commit: '200' })
    movePointer(250, 150)
    expect(poses.style.backgroundPosition).toBe(cellPosition(CENTRE_CELL))
    movePointer(400, 150)
    expect(poses.style.backgroundPosition).toBe(cellPosition(aimCell(250, 0, CENTRE_CELL, { commit: 200, release: 30 })))
  })

  it('does not follow a coarse pointer, where there is no cursor to follow', () => {
    setMedia(() => false)
    const { poses } = mount()
    movePointer(400, 400)
    expect(poses.style.backgroundPosition).toBe(cellPosition(CENTRE_CELL))
  })

  it('stops listening once it leaves the document', () => {
    const { host, poses } = mount()
    movePointer(400, 150)
    const turned = poses.style.backgroundPosition
    host.remove()
    movePointer(150, 150)
    expect(poses.style.backgroundPosition).toBe(turned)
  })
})

describe('mascotry-mascot: being poked', () => {
  it('shows a mood layer on a poke and hides it again after the hold', () => {
    vi.useFakeTimers()
    const { button, poses, moods } = mount()
    expect(moods.style.opacity).toBe('0')

    pokeIt(button)
    expect(moods.style.opacity).toBe('1')
    expect(poses.style.opacity).toBe('0')

    vi.advanceTimersByTime(5000)
    expect(moods.style.opacity).toBe('0')
    expect(poses.style.opacity).toBe('1')
  })

  it('goes dizzy when poked repeatedly', () => {
    vi.useFakeTimers()
    const { button, moods } = mount()
    for (let i = 0; i < STREAK_FOR_DIZZY; i += 1) pokeIt(button)
    expect(moods.style.backgroundPosition).toBe(cellPosition(DIZZY_CELL))
  })

  it('shows a mood that is not dizzy for a single poke', () => {
    vi.useFakeTimers()
    const { button, moods } = mount()
    pokeIt(button)
    expect(moods.style.backgroundPosition).not.toBe(cellPosition(DIZZY_CELL))
  })

  it('squashes while reacting', () => {
    vi.useFakeTimers()
    const { host, button } = mount()
    pokeIt(button)
    expect(host.shadowRoot?.querySelector('button')?.style.transform).toContain('scale')
  })

  it('does not squash when the reader asked for less motion', () => {
    vi.useFakeTimers()
    setMedia((query) => query.includes('reduced-motion'))
    const { button } = mount()
    pokeIt(button)
    expect(button.style.transform).toBe('')
  })

  it('drops its pending timers when it leaves the document', () => {
    vi.useFakeTimers()
    const { host, button, moods } = mount()
    pokeIt(button)
    host.remove()
    vi.advanceTimersByTime(5000)
    // Still showing the mood it had: nothing ran after it was disconnected.
    expect(moods.style.opacity).toBe('1')
  })

  it('works again after being moved somewhere else in the page', () => {
    const { host, button, poses } = mount()
    host.remove()
    document.body.append(host)
    host.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0 }) as DOMRect
    movePointer(300, 50)
    expect(poses.style.backgroundPosition).toBe(cellPosition(5))
    expect(button.getAttribute('aria-label')).toBe('Poke the mascot')
  })
})
