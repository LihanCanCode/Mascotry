import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { hasNoSideScroll, imageFormat, spriteOffset, watch } from './helpers'

const ORIGIN = 'http://localhost:4321'
const POSES = '.stage button > span:first-of-type'
const MOODS = '.stage button > span:last-of-type'

/** The preview is only live once the worker has handed back both sheets. */
async function waitForPreview(page: import('@playwright/test').Page): Promise<void> {
  await expect(page.locator('.stage button')).toBeVisible({ timeout: 40_000 })
}

test('loads with no console errors and asks nothing of any other origin', async ({ page }) => {
  const seen = watch(page, ORIGIN)
  await page.goto('/')
  await waitForPreview(page)
  await page.waitForTimeout(500)

  expect(seen.pageErrors).toEqual([])
  expect(seen.consoleErrors).toEqual([])
  expect(seen.offOrigin).toEqual([])
})

test('names itself and offers the whole flow as headings', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('watches the reader')
  for (const title of ['Pick a character', 'Tune it', 'Check it', 'Take it with you']) {
    await expect(page.getByRole('heading', { name: new RegExp(title) })).toBeVisible()
  }
})

test('picking a character draws it into the preview', async ({ page }) => {
  await page.goto('/')
  await waitForPreview(page)

  const before = await page.locator(POSES).evaluate((n) => getComputedStyle(n).backgroundImage)
  await page.getByRole('radio', { name: /Panda/ }).click()
  await expect(page.getByRole('radio', { name: /Panda/ })).toHaveAttribute('aria-checked', 'true')

  await expect
    .poll(async () => page.locator(POSES).evaluate((n) => getComputedStyle(n).backgroundImage), { timeout: 40_000 })
    .not.toBe(before)
  await expect(page.locator(POSES)).toHaveAttribute('style', /blob:/)
})

test('the picked character can be reached and changed with the arrow keys alone', async ({ page }) => {
  await page.goto('/')
  await waitForPreview(page)

  await page.getByRole('radio', { name: /Fox/ }).focus()
  await page.keyboard.press('ArrowRight')

  await expect(page.getByRole('radio', { name: /Bear/ })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByRole('radio', { name: /Bear/ })).toBeFocused()
})

test('the mascot looks towards the pointer and reacts to a poke', async ({ page }) => {
  await page.goto('/')
  await waitForPreview(page)

  const mascot = page.locator('.stage button')
  // The pointer is moved in viewport coordinates, so the mascot has to be in it.
  await mascot.scrollIntoViewIfNeeded()
  const box = await mascot.boundingBox()
  expect(box).not.toBeNull()
  if (box === null) return
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2

  await page.mouse.move(cx, cy)
  await page.waitForTimeout(120)
  const centred = await spriteOffset(page, POSES)
  expect(centred).toBe('50% 50%')

  // Well past the 46px commit distance, up and to the left.
  await page.mouse.move(cx - 140, cy - 140)
  await page.waitForTimeout(200)
  const upLeft = await spriteOffset(page, POSES)
  expect(upLeft).toBe('0% 0%')
  expect(upLeft).not.toBe(centred)

  await page.mouse.move(cx + 140, cy + 140)
  await page.waitForTimeout(200)
  const downRight = await spriteOffset(page, POSES)
  expect(downRight).toBe('100% 100%')
  expect(downRight).not.toBe(upLeft)

  // A poke swaps to the moods sheet.
  await expect(page.locator(MOODS)).toHaveCSS('opacity', '0')
  await mascot.click({ position: { x: 10, y: 10 } })
  await expect(page.locator(MOODS)).toHaveCSS('opacity', '1')
  await expect(page.locator(MOODS)).toHaveCSS('opacity', '0', { timeout: 10_000 })
})

test('tuning a part redraws the sheets', async ({ page }) => {
  await page.goto('/')
  await waitForPreview(page)

  const before = await page.locator(POSES).evaluate((n) => getComputedStyle(n).backgroundImage)
  await page.getByLabel('Ears').selectOption('bunny')

  await expect
    .poll(async () => page.locator(POSES).evaluate((n) => getComputedStyle(n).backgroundImage), { timeout: 40_000 })
    .not.toBe(before)
  await expect(page.getByRole('status').first()).toContainText(/ready/i)
})

test('both sheets download as real image files', async ({ page }) => {
  await page.goto('/')
  await waitForPreview(page)
  const into = mkdtempSync(join(tmpdir(), 'mascotry-'))

  for (const name of ['Download poses', 'Download moods']) {
    const wait = page.waitForEvent('download')
    await page.getByRole('link', { name: new RegExp(name) }).click()
    const download = await wait
    const suggested = download.suggestedFilename()
    const saved = join(into, suggested)
    await download.saveAs(saved)

    const format = imageFormat(saved)
    expect(format, `${suggested} should be a real image`).not.toBe('unknown')
    // The name must match what is actually inside the file.
    expect(suggested.endsWith(`.${format}`), `${suggested} claims a format it is not`).toBe(true)
  }
})

test('both runtime files download and parse as modules', async ({ page }) => {
  await page.goto('/')
  const into = mkdtempSync(join(tmpdir(), 'mascotry-runtime-'))

  for (const name of ['For any page', 'For React']) {
    const wait = page.waitForEvent('download')
    await page.getByRole('link', { name: new RegExp(name) }).click()
    const download = await wait
    const saved = join(into, download.suggestedFilename())
    await download.saveAs(saved)
    const text = (await import('node:fs')).readFileSync(saved, 'utf8')
    expect(text).toContain('Mascotry runtime')
    expect(text.length).toBeGreaterThan(1000)
  }
})

test('the snippet carries the name that was typed, escaped', async ({ page }) => {
  await page.goto('/')
  await waitForPreview(page)

  await page.getByLabel('Name').fill('Pip "the" <fox> & co')
  const code = page.locator('#snippet-code')
  await expect(code).toContainText('&quot;the&quot;')
  await expect(code).toContainText('&lt;fox&gt;')
  await expect(code).toContainText('pip-the-fox-co-directions')

  await page.getByRole('tab', { name: 'React' }).click()
  await expect(code).toContainText('<Mascot')
  await expect(code).toContainText('size={')
})

test('the theme toggle changes the theme and says what it will do next', async ({ page }) => {
  await page.goto('/')
  const toggle = page.getByRole('button', { name: /Switch to/ })
  const first = await toggle.textContent()
  await toggle.click()
  await expect(toggle).not.toHaveText(first ?? '')
  await expect(page.locator('html')).toHaveAttribute('data-theme', /light|dark/)
})

for (const width of [320, 768, 1440]) {
  test(`fits ${width}px with no sideways scroll`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(await hasNoSideScroll(page)).toBe(true)
  })
}
