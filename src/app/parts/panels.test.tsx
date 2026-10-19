// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { DEFAULT_CONFIG } from '../../studio'
import { analysePhoto } from '../../photo'
import { sketchFace, sketchNoFace } from '../../photo/fixtures'
import type { Pixels } from '../../image/types'
import { installBrowserBits } from '../testDom'
import { DescribePanel } from './DescribePanel'
import { PhotoPanel } from './PhotoPanel'

beforeAll(() => {
  installBrowserBits()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('DescribePanel', () => {
  it('offers a box, a surprise and a clear', () => {
    render(<DescribePanel text="" note={null} onDescribe={vi.fn()} />)
    expect(screen.getByLabelText('Describe your character')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Surprise me' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Clear' })).toBeTruthy()
  })

  it('says what it has read and what it skipped', () => {
    render(
      <DescribePanel
        text="beanie and a llama"
        note={{ matched: ['beanie'], ignored: ['llama'] }}
        onDescribe={vi.fn()}
      />,
    )
    expect(screen.getByText(/Read: beanie\./)).toBeTruthy()
    expect(screen.getByText(/Skipped: llama\./)).toBeTruthy()
  })

  it('admits when it recognised nothing', () => {
    render(<DescribePanel text="llama" note={{ matched: [], ignored: ['llama'] }} onDescribe={vi.fn()} />)
    expect(screen.getByText(/Nothing recognised in that yet/)).toBeTruthy()
  })

  it('invites a description before anything is typed', () => {
    render(<DescribePanel text="" note={null} onDescribe={vi.fn()} />)
    expect(screen.getByText(/Nothing read yet/)).toBeTruthy()
  })

  it('reports the typing once it settles, not on every keystroke', () => {
    vi.useFakeTimers()
    const onDescribe = vi.fn()
    render(<DescribePanel text="" note={null} onDescribe={onDescribe} />)
    const box = screen.getByLabelText('Describe your character')

    fireEvent.change(box, { target: { value: 'a c' } })
    fireEvent.change(box, { target: { value: 'a cat' } })
    expect(onDescribe).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(onDescribe).toHaveBeenCalledTimes(1)
    expect(onDescribe).toHaveBeenCalledWith('a cat')
  })

  it('fills the box from the example bag, differently each press', () => {
    vi.useFakeTimers()
    const onDescribe = vi.fn()
    render(<DescribePanel text="" note={null} onDescribe={onDescribe} />)
    const box = screen.getByLabelText('Describe your character') as HTMLTextAreaElement

    fireEvent.click(screen.getByRole('button', { name: 'Surprise me' }))
    const first = box.value
    fireEvent.click(screen.getByRole('button', { name: 'Surprise me' }))
    const second = box.value

    expect(first.length).toBeGreaterThan(0)
    expect(second).not.toBe(first)
    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(onDescribe).toHaveBeenCalledWith(second)
  })

  it('clears the box, and cannot be cleared when it is already empty', () => {
    render(<DescribePanel text="" note={null} onDescribe={vi.fn()} />)
    const clear = screen.getByRole('button', { name: 'Clear' }) as HTMLButtonElement
    expect(clear.disabled).toBe(true)

    const box = screen.getByLabelText('Describe your character') as HTMLTextAreaElement
    fireEvent.change(box, { target: { value: 'a cat' } })
    expect(clear.disabled).toBe(false)
    fireEvent.click(clear)
    expect(box.value).toBe('')
  })
})

describe('PhotoPanel', () => {
  const file = new File([new Uint8Array([1, 2, 3])], 'face.png', { type: 'image/png' })

  function panel(options: {
    readonly decode?: (blob: Blob) => Promise<Pixels>
    readonly reading?: Parameters<typeof PhotoPanel>[0]['reading']
    readonly onRead?: (reading: ReturnType<typeof analysePhoto>) => void
    readonly onChange?: (patch: Partial<typeof DEFAULT_CONFIG>) => void
  } = {}): void {
    render(
      <PhotoPanel
        config={DEFAULT_CONFIG}
        reading={options.reading ?? null}
        onRead={options.onRead ?? vi.fn()}
        onChange={options.onChange ?? vi.fn()}
        decode={options.decode ?? (async () => sketchFace({ skin: '#8a5a38' }))}
      />,
    )
  }

  it('promises, in words, that the photo is not uploaded', () => {
    panel()
    expect(screen.getByText(/never uploaded/)).toBeTruthy()
    expect(screen.getByText(/not a portrait/)).toBeTruthy()
  })

  it('offers both a drop zone and a file picker', () => {
    panel()
    expect(screen.getByText('Drop a head-and-shoulders photo here')).toBeTruthy()
    expect(screen.getByLabelText('or choose one')).toBeTruthy()
  })

  it('reads a chosen file and hands back the reading', async () => {
    const onRead = vi.fn()
    panel({ onRead })
    fireEvent.change(screen.getByLabelText('or choose one'), { target: { files: [file] } })
    await waitFor(() => expect(onRead).toHaveBeenCalledTimes(1))
    const reading = onRead.mock.calls[0]?.[0]
    expect(reading?.face).not.toBeNull()
    expect(reading?.values.skin).toBeDefined()
  })

  it('shows the photo next to the character it produced', async () => {
    const onRead = vi.fn()
    panel({ onRead })
    fireEvent.change(screen.getByLabelText('or choose one'), { target: { files: [file] } })
    await waitFor(() => expect(screen.getByLabelText(/The photo you chose/)).toBeTruthy())
    expect(screen.getByLabelText(/The character read from the photo/)).toBeTruthy()
  })

  it('reads a dropped file as well as a chosen one', async () => {
    const onRead = vi.fn()
    panel({ onRead })
    const zone = screen.getByText('Drop a head-and-shoulders photo here').parentElement
    expect(zone).not.toBeNull()
    if (zone === null) return
    fireEvent.dragOver(zone)
    fireEvent.drop(zone, { dataTransfer: { files: [file] } })
    await waitFor(() => expect(onRead).toHaveBeenCalledTimes(1))
  })

  it('says what went wrong instead of failing silently', async () => {
    panel({
      decode: () => Promise.reject(new Error('That is not a PNG, JPEG, WebP or GIF image.')),
    })
    fireEvent.change(screen.getByLabelText('or choose one'), { target: { files: [file] } })
    await waitFor(() => expect(screen.getByText(/not a PNG, JPEG, WebP or GIF/)).toBeTruthy())
  })

  it('does nothing at all when no file arrives', () => {
    const onRead = vi.fn()
    panel({ onRead })
    fireEvent.change(screen.getByLabelText('or choose one'), { target: { files: [] } })
    expect(onRead).not.toHaveBeenCalled()
  })

  describe('the readout', () => {
    const reading = analysePhoto(sketchFace({ skin: '#8a5a38', hair: '#2b2230', hairDrop: 0.5, glasses: true }))

    it('lists every field it read, with a confidence', () => {
      panel({ reading })
      const list = screen.getByRole('list', { name: 'What was read' })
      expect(within(list).getByText('Skin or fur')).toBeTruthy()
      expect(screen.getAllByText(/% sure/).length).toBeGreaterThanOrEqual(3)
    })

    it('says whether each reading was used or left alone', () => {
      panel({ reading })
      expect(screen.getAllByText(/used/).length).toBeGreaterThanOrEqual(1)
    })

    it('lets a colour it read be overridden', () => {
      const onChange = vi.fn()
      panel({ reading, onChange })
      fireEvent.change(screen.getByLabelText('Skin or fur'), { target: { value: '#112233' } })
      expect(onChange).toHaveBeenCalledWith({ skin: '#112233' })
    })

    it('lets a part it read be overridden', () => {
      const onChange = vi.fn()
      panel({ reading, onChange })
      fireEvent.change(screen.getByLabelText('Hair style'), { target: { value: 'bun' } })
      expect(onChange).toHaveBeenCalledWith({ hairStyle: 'bun' })
    })

    it('prints what it would not claim', () => {
      panel({ reading })
      expect(screen.getByText(/Eye colour is not read/)).toBeTruthy()
      expect(screen.getByText(/Glasses shape is a guess/)).toBeTruthy()
    })

    it('says plainly when a photo held no face', () => {
      panel({ reading: analysePhoto(sketchNoFace()) })
      expect(screen.getByText(/Nothing was read from that photo/)).toBeTruthy()
      expect(screen.getByText(/No face was found/)).toBeTruthy()
    })
  })
})
