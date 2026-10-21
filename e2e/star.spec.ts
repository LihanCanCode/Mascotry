import { expect, test } from '@playwright/test'

const REPO = 'https://github.com/LihanCanCode/Mascotry'

/** The ask only arrives once the sheets exist, which is also when the preview appears. */
async function waitForExport(page: import('@playwright/test').Page): Promise<void> {
  await expect(page.locator('.stage button')).toBeVisible({ timeout: 40_000 })
}

test('the masthead always offers the repository, in a new tab', async ({ page }) => {
  await page.goto('/')
  const link = page.getByRole('link', { name: 'Star on GitHub' })
  await expect(link).toBeVisible()
  await expect(link).toHaveAttribute('href', REPO)
  await expect(link).toHaveAttribute('target', '_blank')
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
})

test('the ask arrives with the finished mascot, and goes for good when dismissed', async ({ page }) => {
  await page.goto('/')
  await waitForExport(page)

  const ask = page.getByRole('link', { name: 'Star Mascotry on GitHub' })
  await expect(ask).toBeVisible()
  await expect(ask).toHaveAttribute('href', REPO)

  // Nothing is covered: the export controls are still reachable underneath it.
  await expect(page.getByRole('link', { name: /Download poses/ })).toBeVisible()

  await page.getByRole('button', { name: /No thanks/ }).click()
  await expect(ask).toBeHidden()

  await page.reload()
  await waitForExport(page)
  await expect(page.getByRole('link', { name: 'Star Mascotry on GitHub' })).toHaveCount(0)
  // The quiet one is still there, because it is not the ask.
  await expect(page.getByRole('link', { name: 'Star on GitHub' })).toBeVisible()
})

test('a second mascot is not a second ask', async ({ page }) => {
  await page.goto('/')
  await waitForExport(page)
  await expect(page.getByRole('link', { name: 'Star Mascotry on GitHub' })).toBeVisible()

  await page.getByRole('radio', { name: /Panda/ }).click()
  await page.reload()
  await waitForExport(page)
  await expect(page.getByRole('link', { name: 'Star Mascotry on GitHub' })).toHaveCount(0)
})
