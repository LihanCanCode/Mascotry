// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { DEFAULT_CONFIG, STUDIO_PRESETS } from '../../studio'
import { installBrowserBits } from '../testDom'
import { createThumbCache } from '../state/thumbs'
import { PickGrid } from './PickGrid'
import { TunePanel } from './TunePanel'
import { PreviewPanel } from './PreviewPanel'
import { ExportPanel, extensionOf } from './ExportPanel'
import { CopyButton } from './CopyButton'
import { ThemeToggle } from './ThemeToggle'
import { PixelCanvas } from './PixelCanvas'

beforeAll(() => {
  installBrowserBits()
})

beforeEach(() => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  document.documentElement.removeAttribute('data-theme')
  localStorage.clear()
})

const URLS = { directions: 'blob:poses', reactions: 'blob:moods' }

describe('PickGrid', () => {
  function grid(onPick = vi.fn()): { onPick: ReturnType<typeof vi.fn> } {
    render(<PickGrid pickedId="fox" cache={createThumbCache()} onPick={onPick} />)
    return { onPick }
  }

  it('is a radio group holding every preset', () => {
    grid()
    expect(screen.getByRole('radiogroup', { name: 'Character' })).toBeTruthy()
    expect(screen.getAllByRole('radio')).toHaveLength(STUDIO_PRESETS.length)
  })

  it('marks the picked one with a word as well as a colour', () => {
    grid()
    const fox = screen.getByRole('radio', { name: /Fox/ })
    expect(fox.getAttribute('aria-checked')).toBe('true')
    expect(within(fox).getByText('Picked')).toBeTruthy()
  })

  it('leaves only the picked card in the tab order', () => {
    grid()
    const stops = screen.getAllByRole('radio').filter((node) => node.getAttribute('tabindex') === '0')
    expect(stops).toHaveLength(1)
    expect(stops[0]?.textContent).toContain('Fox')
  })

  it('reports a pick', () => {
    const { onPick } = grid()
    fireEvent.click(screen.getByRole('radio', { name: /Panda/ }))
    expect(onPick).toHaveBeenCalledWith('panda')
  })

  it.each([
    ['ArrowRight', 1],
    ['ArrowDown', 1],
    ['ArrowLeft', STUDIO_PRESETS.length - 1],
    ['ArrowUp', STUDIO_PRESETS.length - 1],
    ['End', STUDIO_PRESETS.length - 1],
    ['Home', 0],
  ])('moves the selection with %s', (key, index) => {
    const { onPick } = grid()
    fireEvent.keyDown(screen.getByRole('radio', { name: /Fox/ }), { key })
    expect(onPick).toHaveBeenCalledWith(STUDIO_PRESETS[index]?.id)
  })

  it('ignores a key that is not a movement', () => {
    const { onPick } = grid()
    fireEvent.keyDown(screen.getByRole('radio', { name: /Fox/ }), { key: 'a' })
    expect(onPick).not.toHaveBeenCalled()
  })

  it('draws a thumbnail for each card and keeps it in the cache', () => {
    const cache = createThumbCache()
    render(<PickGrid pickedId="fox" cache={cache} onPick={vi.fn()} />)
    expect(screen.getAllByRole('img').length).toBe(STUDIO_PRESETS.length)
    expect(cache.size).toBe(STUDIO_PRESETS.length)
  })

  it('still shows a usable card when the drawing cannot be made', () => {
    const broken = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = (() => null) as HTMLCanvasElement['getContext']
    try {
      render(<PickGrid pickedId="fox" cache={createThumbCache()} onPick={vi.fn()} />)
      expect(screen.queryAllByRole('img')).toHaveLength(0)
      expect(screen.getByRole('radio', { name: /Fox/ })).toBeTruthy()
    } finally {
      HTMLCanvasElement.prototype.getContext = broken
    }
  })
})

describe('PixelCanvas', () => {
  it('paints the buffer it was handed and names it', () => {
    const image = { width: 2, height: 2, data: new Uint8ClampedArray(16).fill(200) }
    render(<PixelCanvas image={image} display={32} alt="a tiny square" />)
    const canvas = screen.getByRole('img', { name: 'a tiny square' }) as HTMLCanvasElement
    expect(canvas.width).toBe(2)
    expect(canvas.style.width).toBe('32px')
  })
})

describe('TunePanel', () => {
  function panel(): { onChange: ReturnType<typeof vi.fn>; onName: ReturnType<typeof vi.fn> } {
    const onChange = vi.fn()
    const onName = vi.fn()
    render(<TunePanel config={DEFAULT_CONFIG} name="Pip" onName={onName} onChange={onChange} />)
    return { onChange, onName }
  }

  it('labels every control', () => {
    panel()
    for (const label of ['Name', 'Skin or fur', 'Hair', 'Eyes', 'Shirt', 'Accents', 'Face shape', 'Ears',
      'Hair style', 'Facial hair', 'Glasses', 'Headwear', 'Eye size', 'Blushed cheeks']) {
      expect(screen.getByLabelText(label), label).toBeTruthy()
    }
  })

  it('reports a colour change as a config patch', () => {
    const { onChange } = panel()
    fireEvent.change(screen.getByLabelText('Skin or fur'), { target: { value: '#123456' } })
    expect(onChange).toHaveBeenCalledWith({ skin: '#123456' })
  })

  it('reports a part change as a config patch', () => {
    const { onChange } = panel()
    fireEvent.change(screen.getByLabelText('Ears'), { target: { value: 'bunny' } })
    expect(onChange).toHaveBeenCalledWith({ ears: 'bunny' })
  })

  it('reports the blush toggle', () => {
    const { onChange } = panel()
    fireEvent.click(screen.getByLabelText('Blushed cheeks'))
    expect(onChange).toHaveBeenCalledWith({ blush: false })
  })

  it('reports a new name', () => {
    const { onName } = panel()
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Bramble' } })
    expect(onName).toHaveBeenCalledWith('Bramble')
  })

  it('offers every option the studio can draw for a part', () => {
    panel()
    const ears = screen.getByLabelText('Ears') as HTMLSelectElement
    expect(Array.from(ears.options).map((o) => o.value))
      .toEqual(['human', 'cat', 'bear', 'fox', 'bunny', 'bolt'])
  })
})

describe('PreviewPanel', () => {
  function panel(urls: typeof URLS | null, busy = false): {
    onSize: ReturnType<typeof vi.fn>
    onBackdrop: ReturnType<typeof vi.fn>
  } {
    const onSize = vi.fn()
    const onBackdrop = vi.fn()
    render(
      <PreviewPanel
        urls={urls} name="Pip" size={160} backdrop="checker" busy={busy}
        onSize={onSize} onBackdrop={onBackdrop}
      />,
    )
    return { onSize, onBackdrop }
  }

  it('says it is drawing before there is anything to show', () => {
    panel(null, true)
    expect(screen.getByText(/Drawing the first pose/)).toBeTruthy()
  })

  it('says so plainly when there is nothing and nothing is happening', () => {
    panel(null, false)
    expect(screen.getByText('No drawing yet.')).toBeTruthy()
  })

  it('shows a pokeable mascot once the sheets are in', () => {
    panel(URLS)
    expect(screen.getByRole('button', { name: 'Poke the Pip' })).toBeTruthy()
  })

  it('reports a new size', () => {
    const { onSize } = panel(URLS)
    fireEvent.change(screen.getByLabelText(/Size on the page/), { target: { value: '200' } })
    expect(onSize).toHaveBeenCalledWith(200)
  })

  it('offers all three backdrops and reports a change', () => {
    const { onBackdrop } = panel(URLS)
    expect(screen.getByLabelText('Checkerboard')).toBeTruthy()
    fireEvent.click(screen.getByLabelText('Dark'))
    expect(onBackdrop).toHaveBeenCalledWith('dark')
  })
})

describe('ExportPanel', () => {
  function panel(mime: 'image/webp' | 'image/png' = 'image/webp'): {
    onResolution: ReturnType<typeof vi.fn>
  } {
    const onResolution = vi.fn()
    render(
      <ExportPanel
        urls={URLS} mime={mime} slug="pip" name="Pip" size={128} resolution={360}
        onResolution={onResolution}
      />,
    )
    return { onResolution }
  }

  it('reads the extension off the format that was really encoded', () => {
    expect(extensionOf('image/webp')).toBe('webp')
    expect(extensionOf('image/png')).toBe('png')
  })

  it('names the downloads after the mascot and the real format', () => {
    panel()
    expect(screen.getByRole('link', { name: /Download poses/ }).getAttribute('download'))
      .toBe('pip-directions.webp')
    expect(screen.getByRole('link', { name: /Download moods/ }).getAttribute('download'))
      .toBe('pip-reactions.webp')
  })

  it('falls back to png in the file name when webp was not available', () => {
    panel('image/png')
    expect(screen.getByRole('link', { name: /Download poses/ }).getAttribute('download'))
      .toBe('pip-directions.png')
    expect(screen.getAllByText(/pip-directions\.png/).length).toBeGreaterThan(0)
  })

  it('offers both runtime files', () => {
    panel()
    expect(screen.getByRole('link', { name: /For any page/ }).getAttribute('download'))
      .toBe('mascotry-mascot.js')
    expect(screen.getByRole('link', { name: /For React/ }).getAttribute('download'))
      .toBe('mascotry-react.js')
  })

  it('reports a resolution change', () => {
    const { onResolution } = panel()
    fireEvent.click(screen.getByLabelText('512px'))
    expect(onResolution).toHaveBeenCalledWith(512)
  })

  it('says how big the sheet will be', () => {
    panel()
    expect(screen.getByText(/1080px square/)).toBeTruthy()
  })

  it('switches between the two snippets', () => {
    panel()
    expect(screen.getByRole('tabpanel').textContent).toContain('<mascotry-mascot')
    fireEvent.click(screen.getByRole('tab', { name: 'React' }))
    expect(screen.getByRole('tabpanel').textContent).toContain('<Mascot')
  })

  it('tells the reader when there are no sheets yet', () => {
    render(
      <ExportPanel
        urls={null} mime={null} slug="pip" name="Pip" size={128} resolution={256}
        onResolution={vi.fn()}
      />,
    )
    expect(screen.getByText(/appear here once the drawing finishes/)).toBeTruthy()
  })
})

describe('CopyButton', () => {
  it('says what it copied', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    render(<CopyButton text="hello" what="the snippet" />)

    fireEvent.click(screen.getByRole('button'))
    await screen.findByText('the snippet copied to the clipboard.')
    expect(writeText).toHaveBeenCalledWith('hello')
  })

  it('says so when the browser refuses, rather than looking like it worked', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } })
    render(<CopyButton text="hello" what="the snippet" />)

    fireEvent.click(screen.getByRole('button'))
    await screen.findByText(/would not let the page use the clipboard/)
  })
})

describe('ThemeToggle', () => {
  it('names the theme it will switch to, not the one that is on', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button', { name: /Switch to dark/ })
    fireEvent.click(button)
    expect(screen.getByRole('button', { name: /Switch to light/ })).toBeTruthy()
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })
})
