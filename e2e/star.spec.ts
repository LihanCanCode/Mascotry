import { expect, test } from '@playwright/test'

const REPO = 'https://github.com/LihanCanCode/Mascotry'
const ASK = 'Star Mascotry on GitHub'

/** The sheets exist once the preview is live. That is not yet the moment to ask. */
async function waitForSheets(page: import('@playwright/test').Page): Promise<void> {
  await expect(page.locator('.stage button')).toBeVisible({ timeout: 40_000 })
}

/** Save a file the way a visitor would, and swallow the download itself. */
async function take(page: import('@playwright/test').Page, name: RegExp): Promise<void> {
  const wait = page.waitForEvent('download')
  await page.getByRole('link', { name }).click()
  await (await wait).cancel()
}

test('the masthead always offers the repository, in a new tab', async ({ page }) => {
  await page.goto('/')
  const link = page.getByRole('link', { name: 'Star on GitHub' })
  await expect(link).toBeVisible()
  await expect(link).toHaveAttribute('href', REPO)
  await expect(link).toHaveAttribute('target', '_blank')
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
})

test('nothing asks on arrival, however long the page is left alone', async ({ page }) => {
  await page.goto('/')
  await waitForSheets(page)
  await page.waitForTimeout(1000)
  await expect(page.getByRole('link', { name: ASK })).toHaveCount(0)
})

test('the ask arrives with the first file taken, and goes for good when dismissed', async ({ page }) => {
  await page.goto('/')
  await waitForSheets(page)
  await take(page, /Download poses/)

  const ask = page.getByRole('link', { name: ASK })
  await expect(ask).toBeVisible()
  await expect(ask).toHaveAttribute('href', REPO)
  // Nothing is covered: the rest of the export step is still reachable.
  await expect(page.getByRole('link', { name: /Download moods/ })).toBeVisible()

  await page.getByRole('button', { name: /No thanks/ }).click()
  await expect(ask).toBeHidden()

  await page.reload()
  await waitForSheets(page)
  await take(page, /Download moods/)
  await expect(page.getByRole('link', { name: ASK })).toHaveCount(0)
  // The quiet one is still there, because it is not the ask.
  await expect(page.getByRole('link', { name: 'Star on GitHub' })).toBeVisible()
})

test('a copied snippet counts as leaving with something', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')
  await waitForSheets(page)
  await expect(page.getByRole('link', { name: ASK })).toHaveCount(0)

  await page.getByRole('button', { name: /Copy the HTML snippet/ }).click()
  await expect(page.getByRole('link', { name: ASK })).toBeVisible()
})

test('a second mascot is not a second ask', async ({ page }) => {
  await page.goto('/')
  await waitForSheets(page)
  await take(page, /Download poses/)
  await expect(page.getByRole('link', { name: ASK })).toBeVisible()

  await page.getByRole('radio', { name: /Panda/ }).click()
  await page.reload()
  await waitForSheets(page)
  await take(page, /Download poses/)
  await expect(page.getByRole('link', { name: ASK })).toHaveCount(0)
})
