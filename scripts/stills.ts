/**
 * Six stills of the running site, for posts and listings.
 *
 *   pnpm run stills
 *
 * Captured from the production build at a desktop width and a device pixel
 * ratio that lands exactly on 1600px, light theme, no browser chrome.
 */
import { mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'
import type { Browser, Page } from '@playwright/test'
import { APP_THEME_KEY, DEMO_THEME_KEY, fixTheme, openDoor, samplePhoto, scrollTo, waitForMascot } from './media/app'
import { serve } from './media/serve'

const OUT = join('media', 'stills')
const PORT = 4337
const VIEWPORT = { width: 1280, height: 800 }
/** 1280 * 1.25 = 1600, the width every still is asked to be. */
const SCALE = 1.25

async function openApp(browser: Browser, origin: string, key: string, path: string): Promise<Page> {
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: SCALE })
  const page = await context.newPage()
  await fixTheme(page, key, 'light')
  await page.goto(`${origin}${path}`)
  return page
}

async function shoot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: join(OUT, `${name}.png`) })
  console.log(`${OUT}/${name}.png  ${VIEWPORT.width * SCALE}x${VIEWPORT.height * SCALE}`)
}

async function main(): Promise<void> {
  rmSync(OUT, { recursive: true, force: true })
  mkdirSync(OUT, { recursive: true })
  const site = await serve('dist', PORT)
  const browser = await chromium.launch()
  try {
    const app = await openApp(browser, site.origin, APP_THEME_KEY, '/')
    await waitForMascot(app)
    await shoot(app, '1-hero')

    await scrollTo(app, '#start', -24)
    await app.waitForTimeout(900)
    await shoot(app, '2-gallery')

    await openDoor(app, /Describe it/)
    const box = app.getByLabel('Describe your character')
    await box.click()
    await box.pressSequentially('curly dark hair, round glasses, short beard,', { delay: 24 })
    await app.getByText(/Read: /).first().waitFor({ timeout: 60_000 })
    await app.waitForTimeout(900)
    await scrollTo(app, '#start', -24)
    await shoot(app, '3-describe')

    await openDoor(app, /From a photo/)
    await app.getByLabel('or choose one').setInputFiles(samplePhoto())
    await app.getByRole('heading', { name: 'What the photo was read as' }).waitFor({ timeout: 60_000 })
    await app.waitForTimeout(1500)
    // Framed on the readout: the drop zone alone says nothing about what it found.
    await scrollTo(app, '.photo-pair', -300)
    await shoot(app, '4-photo')

    await scrollTo(app, '.snippet', -470)
    await app.waitForTimeout(600)
    await shoot(app, '5-export')
    await app.context().close()

    const demo = await openApp(browser, site.origin, DEMO_THEME_KEY, '/demo.html')
    await demo.locator('#plot-buddy').waitFor({ timeout: 60_000 })
    await demo.waitForTimeout(1500)
    await shoot(demo, '6-demo')
    await demo.context().close()
  } finally {
    await browser.close()
    await site.stop()
  }
}

await main()
