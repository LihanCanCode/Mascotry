/**
 * Driving the built site under Playwright: the handful of moves the stills and
 * the reel both need, written once so a shot and a screenshot of the same
 * panel are reached the same way.
 */
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Page } from '@playwright/test'
import { writeFacePng } from '../../e2e/fixture'

export const APP_THEME_KEY = 'mascotry.theme'
export const DEMO_THEME_KEY = 'mossgate.theme'

/** Pin a theme before any script runs, so the first paint is already right. */
export async function fixTheme(page: Page, key: string, theme: 'light' | 'dark'): Promise<void> {
  await page.addInitScript(
    ([storageKey, value]) => {
      try {
        window.localStorage.setItem(String(storageKey), String(value))
      } catch {
        // No storage: the page falls back to the system preference.
      }
    },
    [key, theme],
  )
}

/** Wait until the studio has drawn a real mascot rather than its placeholder. */
export async function waitForMascot(page: Page): Promise<void> {
  await page.locator('.stage button').first().waitFor({ state: 'visible', timeout: 60_000 })
  await page.waitForTimeout(700)
}

export async function openDoor(page: Page, name: RegExp): Promise<void> {
  await page.getByRole('tab', { name }).click()
}

/** A synthetic head-and-shoulders photograph, written where a file input can take it. */
export function samplePhoto(): string {
  const into = mkdtempSync(join(tmpdir(), 'mascotry-media-'))
  return writeFacePng(join(into, 'face.png'), {
    skin: '#8a5a38', hair: '#2b2230', hairCap: 0.2, hairDrop: 0.5, shirt: '#2f8f8f', glasses: true,
  })
}

/** Scroll a section to the top of the viewport and let the motion settle. */
export async function scrollTo(page: Page, selector: string, offset = 0): Promise<void> {
  await page.evaluate(([target, top]) => {
    const node = document.querySelector(String(target))
    if (node === null) throw new Error(`no element for ${String(target)}`)
    const y = node.getBoundingClientRect().top + window.scrollY + Number(top)
    window.scrollTo({ top: y, behavior: 'instant' })
  }, [selector, offset] as const)
  await page.waitForTimeout(300)
}
