import { mkdirSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { fixTheme, hasNoSideScroll } from './helpers'

/**
 * Full-page captures at the three widths that matter, in both themes, for both
 * pages. These are for looking at: an automated check can tell you the page
 * does not scroll sideways, but not that the hero is cramped or that a card
 * has lost its name.
 */
const SHOTS = process.env['MASCOTRY_SHOTS'] ?? 'e2e/__shots__'
const WIDTHS = [320, 768, 1440] as const
const THEMES = ['light', 'dark'] as const

const PAGES = [
  { name: 'app', path: '/', key: 'mascotry.theme', ready: '.stage button' },
  { name: 'demo', path: '/demo.html', key: 'mossgate.theme', ready: '#plot-buddy span:nth-of-type(1)' },
] as const

test.beforeAll(() => {
  mkdirSync(SHOTS, { recursive: true })
})

for (const target of PAGES) {
  for (const theme of THEMES) {
    for (const width of WIDTHS) {
      test(`${target.name} at ${width} in ${theme}`, async ({ page }) => {
        await fixTheme(page, theme, target.key)
        await page.setViewportSize({ width, height: width < 400 ? 720 : 900 })
        await page.goto(target.path)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        // Let the first render land so the captures show a real mascot.
        await page.locator(target.ready).waitFor({ state: 'attached', timeout: 40_000 })
        await page.waitForTimeout(1200)

        expect(await hasNoSideScroll(page), `${target.name} overflows at ${width}px`).toBe(true)
        await page.screenshot({ path: `${SHOTS}/${target.name}-${width}-${theme}.png`, fullPage: true })
      })
    }
  }
}
