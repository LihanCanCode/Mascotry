import { readFileSync } from 'node:fs'
import type { Page } from '@playwright/test'

export interface PageWatch {
  readonly consoleErrors: string[]
  readonly pageErrors: string[]
  readonly offOrigin: string[]
}

/**
 * Watches a page for the three things that must never happen: an error in the
 * console, an uncaught exception, and a request to anywhere but this origin.
 *
 * The last one is the project's central promise — no accounts, no servers, no
 * fonts, no cost — so it is checked rather than claimed.
 */
export function watch(page: Page, origin: string): PageWatch {
  const result: PageWatch = { consoleErrors: [], pageErrors: [], offOrigin: [] }
  page.on('console', (message) => {
    if (message.type() === 'error') result.consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => result.pageErrors.push(error.message))
  page.on('request', (request) => {
    const url = request.url()
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith(origin)) return
    result.offOrigin.push(url)
  })
  return result
}

/** Fix the theme before any script runs, so the first paint is already right. */
export async function fixTheme(page: Page, theme: 'light' | 'dark', key: string): Promise<void> {
  await page.addInitScript(
    ([storageKey, value]) => {
      try {
        window.localStorage.setItem(String(storageKey), String(value))
      } catch {
        // Nothing to do: the page falls back to the system preference.
      }
    },
    [key, theme],
  )
}

/** True when the document is no wider than its own viewport. */
export async function hasNoSideScroll(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const root = document.documentElement
    return root.scrollWidth <= root.clientWidth + 1
  })
}

export type ImageFormat = 'webp' | 'png' | 'unknown'

/** Identify an image by its magic bytes rather than by what it was named. */
export function imageFormat(path: string): ImageFormat {
  const bytes = readFileSync(path)
  if (bytes.length < 16) return 'unknown'
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'webp'
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  if (bytes.subarray(0, 8).equals(png)) return 'png'
  return 'unknown'
}

/** The sprite offset the given layer of a mascot is currently showing. */
export async function spriteOffset(page: Page, selector: string): Promise<string> {
  return page.evaluate((target) => {
    const node = document.querySelector(target)
    if (node === null) throw new Error(`no element for ${target}`)
    return getComputedStyle(node).backgroundPosition
  }, selector)
}
