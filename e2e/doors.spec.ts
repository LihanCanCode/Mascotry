import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { writeFacePng } from './fixture'
import { watch } from './helpers'

const ORIGIN = 'http://localhost:4321'
const POSES = '.stage button > span:first-of-type'

async function waitForPreview(page: import('@playwright/test').Page): Promise<void> {
  await expect(page.locator('.stage button')).toBeVisible({ timeout: 40_000 })
}

async function sheet(page: import('@playwright/test').Page): Promise<string> {
  return page.locator(POSES).evaluate((node) => getComputedStyle(node).backgroundImage)
}

test('the three doors are all offered, and the first one is open', async ({ page }) => {
  await page.goto('/')
  for (const name of ['Pick one', 'Describe it', 'From a photo']) {
    await expect(page.getByRole('tab', { name: new RegExp(name) })).toBeVisible()
  }
  await expect(page.getByRole('tab', { name: /Pick one/ })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('radiogroup', { name: 'Character' })).toBeVisible()
})

test('typing a description redraws the character and reports what was read', async ({ page }) => {
  await page.goto('/')
  await waitForPreview(page)
  const before = await sheet(page)

  await page.getByRole('tab', { name: /Describe it/ }).click()
  await page.getByLabel('Describe your character').fill('a grey cat in a red scarf, big eyes')

  await expect.poll(async () => sheet(page), { timeout: 40_000 }).not.toBe(before)
  await expect(page.getByText(/Read: /)).toContainText('cat')
  // The parts panel is the same one the picked characters land in.
  await expect(page.getByLabel('Ears')).toHaveValue('cat')
})

test('a description says what it did not understand', async ({ page }) => {
  await page.goto('/')
  await waitForPreview(page)
  await page.getByRole('tab', { name: /Describe it/ }).click()
  await page.getByLabel('Describe your character').fill('a beanie and a llama on a skateboard')
  await expect(page.getByText(/Skipped: /)).toContainText('llama')
})

test('"Surprise me" fills the box and draws what it says', async ({ page }) => {
  await page.goto('/')
  await waitForPreview(page)
  const before = await sheet(page)

  await page.getByRole('tab', { name: /Describe it/ }).click()
  await page.getByRole('button', { name: 'Surprise me' }).click()

  await expect(page.getByLabel('Describe your character')).not.toHaveValue('')
  await expect.poll(async () => sheet(page), { timeout: 40_000 }).not.toBe(before)
})

test('a dropped photo gives a character and a readout, and goes nowhere', async ({ page }) => {
  const seen = watch(page, ORIGIN)
  const into = mkdtempSync(join(tmpdir(), 'mascotry-photo-'))
  const photo = writeFacePng(join(into, 'face.png'), {
    skin: '#8a5a38', hair: '#2b2230', hairDrop: 0.5, shirt: '#2f8f8f', glasses: true,
  })

  await page.goto('/')
  await waitForPreview(page)
  const before = await sheet(page)

  await page.getByRole('tab', { name: /From a photo/ }).click()
  await page.getByLabel('or choose one').setInputFiles(photo)

  await expect(page.getByRole('heading', { name: 'What the photo was read as' })).toBeVisible()
  await expect(page.getByRole('list', { name: 'What was read' })).toContainText('Skin or fur')
  // Scoped to the readout: the Tune panel has a swatch of the same name.
  await expect(page.locator('.readout').getByLabel('Skin or fur')).not.toHaveValue('#f2c29b')
  await expect(page.getByRole('img', { name: /The photo you chose/ })).toBeVisible()
  await expect.poll(async () => sheet(page), { timeout: 40_000 }).not.toBe(before)

  // The promise the panel makes, checked rather than claimed.
  expect(seen.offOrigin).toEqual([])
  expect(seen.consoleErrors).toEqual([])
  expect(seen.pageErrors).toEqual([])
})

test('a photo with no face in it is refused in plain words', async ({ page }) => {
  const into = mkdtempSync(join(tmpdir(), 'mascotry-blank-'))
  const photo = writeFacePng(join(into, 'wall.png'), {
    skin: '#5a6472', hair: null, shirt: null, background: '#5a6472',
  })

  await page.goto('/')
  await waitForPreview(page)
  await page.getByRole('tab', { name: /From a photo/ }).click()
  await page.getByLabel('or choose one').setInputFiles(photo)

  await expect(page.getByText(/No face was found/)).toBeVisible()
})

test('a file that is not an image at all is refused', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('tab', { name: /From a photo/ }).click()
  await page.getByLabel('or choose one').setInputFiles({
    name: 'notes.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('this is not a photograph'),
  })
  await expect(page.getByText(/not a PNG, JPEG, WebP or GIF/)).toBeVisible()
})

test('a character begun at one door can be finished at another', async ({ page }) => {
  await page.goto('/')
  await waitForPreview(page)

  await page.getByRole('tab', { name: /Describe it/ }).click()
  await page.getByLabel('Describe your character').fill('bald, square glasses')
  await expect(page.getByLabel('Glasses')).toHaveValue('square', { timeout: 40_000 })

  await page.getByRole('tab', { name: /Pick one/ }).click()
  await page.getByRole('radio', { name: /Panda/ }).click()
  await expect(page.getByLabel('Ears')).toHaveValue('bear')

  await page.getByLabel('Headwear').selectOption('beret')
  await expect(page.getByLabel('Headwear')).toHaveValue('beret')
  await expect(page.getByRole('status').first()).toContainText(/ready/i, { timeout: 40_000 })
})
