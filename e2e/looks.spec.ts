import { mkdirSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { writeFacePng } from './fixture'
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

/**
 * The two new doors, captured open.
 *
 * The door grid and the pick grid are in the shots above; these are the panels
 * behind the other two doors, including a photo actually read, because the only
 * way to judge whether that readout is legible is to look at it.
 */
for (const theme of THEMES) {
  test(`describe door in ${theme}`, async ({ page }) => {
    await fixTheme(page, theme, 'mascotry.theme')
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto('/')
    await page.getByRole('tab', { name: /Describe it/ }).click()
    await page.getByLabel('Describe your character').fill('curly dark hair, round glasses, short beard, green jumper, brown skin')
    await expect(page.getByText(/Read: /)).toBeVisible({ timeout: 40_000 })
    await page.waitForTimeout(1200)
    expect(await hasNoSideScroll(page)).toBe(true)
    await page.screenshot({ path: `${SHOTS}/door-describe-${theme}.png`, fullPage: true })
  })

  test(`photo door in ${theme}`, async ({ page }) => {
    const into = mkdtempSync(join(tmpdir(), 'mascotry-shot-'))
    const photo = writeFacePng(join(into, 'face.png'), {
      skin: '#8a5a38', hair: '#2b2230', hairCap: 0.2, hairDrop: 0.5, shirt: '#2f8f8f', glasses: true,
    })
    await fixTheme(page, theme, 'mascotry.theme')
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto('/')
    await page.getByRole('tab', { name: /From a photo/ }).click()
    await page.getByLabel('or choose one').setInputFiles(photo)
    await expect(page.getByRole('heading', { name: 'What the photo was read as' })).toBeVisible()
    await page.waitForTimeout(1200)
    expect(await hasNoSideScroll(page)).toBe(true)
    await page.screenshot({ path: `${SHOTS}/door-photo-${theme}.png`, fullPage: true })
  })
}
