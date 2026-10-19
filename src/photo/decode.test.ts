import { describe, expect, it, vi } from 'vitest'
import { MAX_BYTES, MAX_EDGE, fileComplaint, fitWithin, readPhoto, sniffImageType } from './decode'

function bytes(...values: readonly number[]): Uint8Array {
  return new Uint8Array(values)
}

const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13)
const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46)
const WEBP = bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50)
const GIF = bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61)

describe('sniffImageType', () => {
  it('reads a PNG', () => {
    expect(sniffImageType(PNG)).toBe('image/png')
  })

  it('reads a JPEG', () => {
    expect(sniffImageType(JPEG)).toBe('image/jpeg')
  })

  it('reads a WebP, which needs both halves of its header', () => {
    expect(sniffImageType(WEBP)).toBe('image/webp')
    expect(sniffImageType(bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x41, 0x56, 0x45))).toBeNull()
  })

  it('reads a GIF', () => {
    expect(sniffImageType(GIF)).toBe('image/gif')
  })

  it('refuses anything else, whatever it was called', () => {
    expect(sniffImageType(bytes(0x25, 0x50, 0x44, 0x46))).toBeNull()
    expect(sniffImageType(bytes(0x4d, 0x5a, 0x90, 0x00))).toBeNull()
    expect(sniffImageType(bytes())).toBeNull()
    expect(sniffImageType(bytes(0x89, 0x50))).toBeNull()
  })

  it('refuses an SVG, which is a document rather than pixels', () => {
    expect(sniffImageType(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg">'))).toBeNull()
  })
})

describe('fitWithin', () => {
  it('leaves a small photo alone', () => {
    expect(fitWithin(640, 480)).toEqual({ width: 640, height: 480 })
  })

  it('caps the longest edge and keeps the shape', () => {
    const fitted = fitWithin(4000, 3000)
    expect(Math.max(fitted.width, fitted.height)).toBe(MAX_EDGE)
    expect(fitted.width / fitted.height).toBeCloseTo(4 / 3, 2)
  })

  it('caps a tall photo by its height', () => {
    const fitted = fitWithin(1000, 5000)
    expect(fitted.height).toBe(MAX_EDGE)
    expect(fitted.width).toBe(205)
  })

  it('never returns a zero edge', () => {
    expect(fitWithin(1, 100000).width).toBeGreaterThanOrEqual(1)
    expect(fitWithin(0, 0)).toEqual({ width: 1, height: 1 })
  })

  it('takes a smaller cap when asked', () => {
    expect(fitWithin(800, 400, 100)).toEqual({ width: 100, height: 50 })
  })
})

describe('fileComplaint', () => {
  it('passes a normal image', () => {
    expect(fileComplaint(500_000, 'image/jpeg')).toBeNull()
  })

  it('complains about an empty file', () => {
    expect(fileComplaint(0, 'image/png')).toMatch(/empty/i)
  })

  it('complains about an oversized file, in megabytes', () => {
    const said = fileComplaint(MAX_BYTES + 1, 'image/png')
    expect(said).toMatch(/MB/)
  })

  it('complains about a file that is not an image at all', () => {
    expect(fileComplaint(1000, null)).toMatch(/PNG, JPEG, WebP or GIF/)
  })

  it('checks the size before the format, so an enormous PNG is still refused', () => {
    expect(fileComplaint(MAX_BYTES * 2, 'image/png')).toMatch(/larger/)
  })
})

describe('readPhoto', () => {
  it('refuses a file whose bytes are not an image, before trying to decode it', async () => {
    const text = new Blob([new TextEncoder().encode('dear diary, I am not a photograph')])
    await expect(readPhoto(text)).rejects.toThrow(/not a PNG, JPEG, WebP or GIF/)
  })

  it('refuses an empty file', async () => {
    await expect(readPhoto(new Blob([]))).rejects.toThrow(/empty/i)
  })

  it('never reaches the decoder for a file it has already refused', async () => {
    const calls: number[] = []
    const stub = (): Promise<never> => {
      calls.push(1)
      return Promise.reject(new Error('should not be called'))
    }
    vi.stubGlobal('createImageBitmap', stub)
    try {
      await expect(readPhoto(new Blob([new Uint8Array([1, 2, 3, 4])]))).rejects.toThrow(/not a PNG/)
      expect(calls).toEqual([])
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
