// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { App } from './App'
import { installBrowserBits, objectUrls, resetObjectUrls } from './testDom'

/**
 * These run the whole app with no worker, which is the fallback path: jsdom has
 * no `Worker`, so `useSheetRender` renders inline. That is the path a browser
 * without module workers would take, and it is worth having under test.
 */
beforeAll(() => {
  installBrowserBits()
})

beforeEach(() => {
  resetObjectUrls()
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
  document.documentElement.removeAttribute('data-theme')
  localStorage.clear()
})

/**
 * The preview only exists once a render has finished. There are two mascots on
 * the page by then - one in the hero and one in the preview - so this waits for
 * any of them rather than insisting on exactly one.
 */
async function waitForMascot(): Promise<HTMLElement[]> {
  return screen.findAllByRole('button', { name: /Poke the/ }, { timeout: 40_000 })
}

/**
 * The export snippet. Named rather than taken by role alone, because the three
 * doors are a tab set too and both panels answer to `tabpanel`.
 */
function snippet(): HTMLElement {
  return screen.getByRole('tabpanel', { name: /Plain HTML|React/ })
}

describe('App', () => {
  it('draws the first character without being asked', async () => {
    render(<App />)
    expect(screen.getByText('Drawing the mascot.')).toBeTruthy()
    await waitForMascot()
    expect(screen.getByText('The mascot is ready.')).toBeTruthy()
  })

  it('turns the drawing into object URLs for both sheets', async () => {
    render(<App />)
    await waitForMascot()
    expect(objectUrls().issued.length).toBeGreaterThanOrEqual(2)
    expect(objectUrls().issued.every((url) => url.includes('image/'))).toBe(true)
  })

  it('offers the whole flow as headings in order', async () => {
    render(<App />)
    const headings = screen.getAllByRole('heading', { level: 2 }).map((node) => node.textContent)
    expect(headings).toEqual(['1Start a character', '2Tune it', '3Check it', '4Take it with you'])
    await waitForMascot()
  })

  it('offers a way past the masthead for anyone using a keyboard', async () => {
    render(<App />)
    expect(screen.getByRole('link', { name: 'Skip to the three ways in' }).getAttribute('href')).toBe('#start')
    await waitForMascot()
  })

  it('names the mascot in the snippet and renames it when the name changes', async () => {
    render(<App />)
    await waitForMascot()

    expect(snippet().textContent).toContain('label="Fox"')
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Bramble' } })
    await waitFor(() => expect(snippet().textContent).toContain('label="Bramble"'))
    expect(snippet().textContent).toContain('bramble-directions')
  })

  it('escapes a hostile name before it reaches the snippet', async () => {
    render(<App />)
    await waitForMascot()

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: '"><script>alert(1)</script>' } })
    await waitFor(() => {
      const code = snippet().textContent ?? ''
      expect(code).toContain('&quot;&gt;&lt;script&gt;')
      expect(code.match(/<script/g)).toHaveLength(1)
    })
  })

  it('redraws when a part changes', async () => {
    render(<App />)
    await waitForMascot()
    const before = objectUrls().issued.length

    fireEvent.change(screen.getByLabelText('Ears'), { target: { value: 'bunny' } })

    await waitFor(() => expect(objectUrls().issued.length).toBeGreaterThan(before), { timeout: 40_000 })
    // The sheets it replaced are released rather than left holding their images.
    await waitFor(() => expect(objectUrls().revoked.length).toBeGreaterThanOrEqual(2))
  })

  it('redraws when another character is picked', async () => {
    render(<App />)
    await waitForMascot()
    const before = objectUrls().issued.length

    fireEvent.click(screen.getByRole('radio', { name: /Panda/ }))

    expect(screen.getByRole('radio', { name: /Panda/ }).getAttribute('aria-checked')).toBe('true')
    await waitFor(() => expect(objectUrls().issued.length).toBeGreaterThan(before), { timeout: 40_000 })
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Panda')
  })

  it('does not redraw when only the preview size changes', async () => {
    render(<App />)
    await waitForMascot()
    const before = objectUrls().issued.length

    fireEvent.change(screen.getByLabelText(/Size on the page/), { target: { value: '240' } })

    expect(screen.getByLabelText(/Size on the page: 240px/)).toBeTruthy()
    expect(objectUrls().issued.length).toBe(before)
  })

  it('redraws when the export resolution changes', async () => {
    render(<App />)
    await waitForMascot()
    const before = objectUrls().issued.length

    fireEvent.click(screen.getByLabelText('256px'))

    await waitFor(() => expect(objectUrls().issued.length).toBeGreaterThan(before), { timeout: 40_000 })
    expect(screen.getByText(/768px square/)).toBeTruthy()
  })

  it('reports a drawing that could not be made, instead of staying blank', async () => {
    const working = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = (() => null) as HTMLCanvasElement['getContext']
    try {
      render(<App />)
      await waitFor(() => expect(screen.getByRole('alert', { hidden: true })).toBeTruthy(), { timeout: 20_000 })
        .catch(() => undefined)
      await waitFor(() => expect(screen.getByText(/Try a different part or reload/)).toBeTruthy(),
        { timeout: 20_000 })
    } finally {
      HTMLCanvasElement.prototype.getContext = working
    }
  })

  it('offers three doors, all of them equally reachable', async () => {
    render(<App />)
    const doors = screen.getAllByRole('tab')
    const labels = doors.map((door) => door.textContent ?? '')
    expect(labels.some((label) => label.startsWith('Pick one'))).toBe(true)
    expect(labels.some((label) => label.startsWith('Describe it'))).toBe(true)
    expect(labels.some((label) => label.startsWith('From a photo'))).toBe(true)
    await waitForMascot()
  })

  it('opens the describe door and redraws from what is typed', async () => {
    render(<App />)
    await waitForMascot()
    const before = objectUrls().issued.length

    fireEvent.click(screen.getByRole('tab', { name: /Describe it/ }))
    fireEvent.change(screen.getByLabelText('Describe your character'), {
      target: { value: 'a grey cat in a red scarf' },
    })

    await waitFor(() => expect(objectUrls().issued.length).toBeGreaterThan(before), { timeout: 40_000 })
    expect(screen.getByText(/Read: /)).toBeTruthy()
    // And the character it made can still be finished by hand.
    expect((screen.getByLabelText('Ears') as HTMLSelectElement).value).toBe('cat')
  })

  it('opens the photo door and says the photo is never uploaded', async () => {
    render(<App />)
    await waitForMascot()

    fireEvent.click(screen.getByRole('tab', { name: /From a photo/ }))
    expect(screen.getByText('Drop a head-and-shoulders photo here')).toBeTruthy()
    expect(screen.getByText(/It is never uploaded, and it is not kept/)).toBeTruthy()
  })

  it('keeps what was typed when the door is closed and opened again', async () => {
    render(<App />)
    await waitForMascot()

    fireEvent.click(screen.getByRole('tab', { name: /Describe it/ }))
    fireEvent.change(screen.getByLabelText('Describe your character'), { target: { value: 'a beret' } })
    await waitFor(() => expect(screen.getByText(/Read: beret/)).toBeTruthy(), { timeout: 40_000 })

    fireEvent.click(screen.getByRole('tab', { name: /Pick one/ }))
    fireEvent.click(screen.getByRole('tab', { name: /Describe it/ }))
    expect((screen.getByLabelText('Describe your character') as HTMLTextAreaElement).value).toBe('a beret')
  })

  it('releases every object URL when it goes away', async () => {
    const view = render(<App />)
    await waitForMascot()
    const issued = objectUrls().issued.length

    view.unmount()

    expect(objectUrls().revoked.length).toBe(issued)
  })
})
