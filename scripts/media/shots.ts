/**
 * The three shots that are real footage, and the two that are drawn.
 *
 * Every measurement a shot needs is taken from the page at the moment it runs
 * rather than written down here, so the same script drives the tall viewport
 * the reel records and the wide one the landscape cut records.
 */
import type { Page } from '@playwright/test'
import { APP_THEME_KEY, DEMO_THEME_KEY, waitForMascot } from './app'
import type { ShotPlan, Stage } from './record'

async function centreOf(page: Page, selector: string): Promise<{ x: number; y: number }> {
  const box = await page.locator(selector).first().boundingBox()
  if (box === null) throw new Error(`no box for ${selector}`)
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

async function jumpTo(page: Page, selector: string, offset: number): Promise<void> {
  await page.evaluate(([target, top]) => {
    const node = document.querySelector(String(target))
    if (node === null) throw new Error(`no element for ${String(target)}`)
    window.scrollTo({ top: node.getBoundingClientRect().top + window.scrollY + Number(top), behavior: 'instant' })
  }, [selector, offset] as const)
  await page.waitForTimeout(400)
}

/** The gallery, scrolling past the characters. */
export const GALLERY: ShotPlan = {
  name: 'gallery',
  path: '/',
  themeKey: APP_THEME_KEY,
  async prepare(page) {
    await waitForMascot(page)
    // Walk the whole grid once first. Each card draws its own thumbnail the
    // first time it comes near the viewport, and fifty-seven canvas renders
    // arriving during the shot would stall the scroll. Walking it beforehand
    // gets them all drawn and kept, which is also what a second visit looks
    // like.
    await jumpTo(page, '.grid', -40)
    const span = await page.evaluate(() => {
      const grid = document.querySelector('.grid')
      if (grid === null) throw new Error('no grid')
      return grid.getBoundingClientRect().height
    })
    const steps = Math.ceil(span / 600)
    for (let i = 1; i <= steps; i += 1) {
      await page.evaluate((by) => window.scrollBy({ top: Number(by), behavior: 'instant' }), 600)
      await page.waitForTimeout(220)
    }
    await jumpTo(page, '.grid', -40)
    await page.waitForTimeout(900)
  },
  async drive(stage: Stage) {
    const reach = await stage.page.evaluate(() => {
      const grid = document.querySelector('.grid')
      if (grid === null) throw new Error('no grid')
      const box = grid.getBoundingClientRect()
      return box.top + window.scrollY + box.height - window.innerHeight + 40
    })
    await stage.hold(250)
    await stage.scrollTo(reach, 3400)
    await stage.hold(400)
  },
}

/** Typing a description, then panning down to the character it made. */
export const DESCRIBE: ShotPlan = {
  name: 'describe',
  path: '/',
  themeKey: APP_THEME_KEY,
  async prepare(page) {
    await waitForMascot(page)
    await page.getByRole('tab', { name: /Describe it/ }).click()
    await page.getByLabel('Describe your character').waitFor()
    await jumpTo(page, '.describe', -60)
  },
  async drive(stage: Stage) {
    const box = await centreOf(stage.page, '.describe-box')
    await stage.glide(box, 240)
    await stage.click()
    await stage.write('curly hair, round glasses, beard', 58)
    await stage.hold(520)
    const preview = await stage.topOf('#preview')
    await stage.scrollTo(preview - 50, 1200)
    await stage.hold(600)
  },
}

/** The mascot on somebody else's website, watching the cursor. */
export const DEMO: ShotPlan = {
  name: 'demo',
  path: '/demo.html',
  themeKey: DEMO_THEME_KEY,
  async prepare(page) {
    await page.locator('#plot-buddy').waitFor({ timeout: 60_000 })
    await page.waitForTimeout(1800)
    await jumpTo(page, '.hero', -40)
  },
  async drive(stage: Stage) {
    const buddy = await centreOf(stage.page, '#plot-buddy')
    const reach = Math.max(90, Math.min(stage.viewport.width, stage.viewport.height) * 0.22)
    await stage.glide({ x: buddy.x - reach, y: buddy.y - reach * 0.6 }, 520)
    await stage.glide({ x: buddy.x + reach, y: buddy.y - reach * 0.7 }, 620)
    await stage.glide({ x: buddy.x + reach * 0.8, y: buddy.y + reach }, 560)
    await stage.glide(buddy, 420)
    await stage.click()
    await stage.hold(700)
  },
}

export const RECORDED: readonly ShotPlan[] = [GALLERY, DESCRIBE, DEMO]
