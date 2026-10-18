import { expect, test } from '@playwright/test'
import { hasNoSideScroll, watch } from './helpers'

const ORIGIN = 'http://localhost:4321'
/** The sprite layers live inside the custom element's shadow root. */
const SHADOW_POSES = '#plot-buddy span:nth-of-type(1)'
const SHADOW_MOODS = '#plot-buddy span:nth-of-type(2)'
const SHADOW_BUTTON = '#plot-buddy button'

async function waitForBuddy(page: import('@playwright/test').Page): Promise<void> {
  await expect(page.locator(SHADOW_POSES)).toHaveAttribute('style', /blob:/, { timeout: 40_000 })
}

test('loads with no console errors and asks nothing of any other origin', async ({ page }) => {
  const seen = watch(page, ORIGIN)
  await page.goto('/demo.html')
  await waitForBuddy(page)
  await page.waitForTimeout(500)

  expect(seen.pageErrors).toEqual([])
  expect(seen.consoleErrors).toEqual([])
  expect(seen.offOrigin).toEqual([])
})

test('reads as a real site, not a page about mascots', async ({ page }) => {
  await page.goto('/demo.html')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('brickworks')
  await expect(page.getByRole('heading', { name: 'Notice board' })).toBeVisible()
  await expect(page.getByRole('table')).toBeVisible()
  await expect(page.getByRole('link', { name: /Mascotry/ }).first()).toBeVisible()
})

test('the embedded element is the real one, drawn at page load', async ({ page }) => {
  await page.goto('/demo.html')
  await waitForBuddy(page)

  // Shadow DOM, a real button inside, and a sheet that came from a blob rather than a file.
  await expect(page.locator(SHADOW_BUTTON)).toHaveAttribute('aria-label', /Poke the/)
  await expect(page.locator(SHADOW_POSES)).toHaveAttribute('style', /blob:/)
  await expect(page.locator(SHADOW_MOODS)).toHaveAttribute('style', /blob:/)
})

test('the buddy looks towards the pointer and reacts to a poke', async ({ page }) => {
  await page.goto('/demo.html')
  await waitForBuddy(page)

  const button = page.locator(SHADOW_BUTTON)
  await button.scrollIntoViewIfNeeded()
  const box = await button.boundingBox()
  expect(box).not.toBeNull()
  if (box === null) return
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2

  await page.mouse.move(cx, cy)
  await page.waitForTimeout(120)
  const centred = await page.locator(SHADOW_POSES).evaluate((n) => getComputedStyle(n).backgroundPosition)

  await page.mouse.move(cx + 160, cy + 140)
  await page.waitForTimeout(200)
  const moved = await page.locator(SHADOW_POSES).evaluate((n) => getComputedStyle(n).backgroundPosition)
  expect(moved).not.toBe(centred)
  expect(moved).toBe('100% 100%')

  await expect(page.locator(SHADOW_MOODS)).toHaveCSS('opacity', '0')
  await button.click({ position: { x: 8, y: 8 } })
  await expect(page.locator(SHADOW_MOODS)).toHaveCSS('opacity', '1')
})

test('swapping buddies swaps the drawing', async ({ page }) => {
  await page.goto('/demo.html')
  await waitForBuddy(page)

  const before = await page.locator(SHADOW_POSES).evaluate((n) => getComputedStyle(n).backgroundImage)
  await page.locator('.buddy-option label', { hasText: 'Rosa' }).click()
  await expect(page.getByRole('radio', { name: 'Rosa' })).toBeChecked()

  await expect(page.locator('#buddy-role')).toContainText('Rosa')
  await expect(page.locator(SHADOW_BUTTON)).toHaveAttribute('aria-label', 'Poke the Rosa')
  await expect
    .poll(async () => page.locator(SHADOW_POSES).evaluate((n) => getComputedStyle(n).backgroundImage),
      { timeout: 40_000 })
    .not.toBe(before)
})

test('the size control resizes the buddy', async ({ page }) => {
  await page.goto('/demo.html')
  await waitForBuddy(page)

  const element = page.locator('#plot-buddy')
  await expect(element).toHaveAttribute('size', '150')
  await page.getByLabel(/How big on the page/).fill('240')
  await expect(element).toHaveAttribute('size', '240')
  await expect(page.locator('#buddy-size-value')).toHaveText('240px')
  const box = await element.boundingBox()
  expect(box?.width).toBeGreaterThan(200)
})

test('the embed code button reports what happened', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/demo.html')
  await waitForBuddy(page)

  await page.getByRole('button', { name: /Copy the embed code/ }).click()
  await expect(page.locator('#buddy-copy-result')).not.toBeEmpty()

  const copied = await page.evaluate(() => navigator.clipboard.readText())
  expect(copied).toContain('<mascotry-mascot')
  expect(copied).toContain('mascotry-mascot.js')
})

for (const width of [320, 768, 1440]) {
  test(`fits ${width}px with no sideways scroll`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/demo.html')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(await hasNoSideScroll(page)).toBe(true)
  })
}
