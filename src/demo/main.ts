/**
 * The Mossgate Allotments page.
 *
 * It is a demonstration, but it is not a mock-up: the mascot in the corner is
 * the real custom element from `src/runtime`, and its sheets are drawn by the
 * real studio when the page loads. Nothing is fetched and no image file is
 * shipped, which is the claim the whole project rests on, so the page that
 * makes the claim had better be the thing that proves it.
 */
import '../runtime/mascotry-element'
import { renderSheet } from '../studio'
import { canvasFactory, rawImageToBlob } from '../studio/browser'
import { htmlSnippet } from '../app/snippets'
import { DEMO_CAST, castConfig, castMember, createSheetStore, type SheetUrls } from './demoLogic'
import { applyStoredTheme, watchTheme } from './theme'
import './demo.css'

const CELL = 256

function must<E extends Element>(selector: string): E {
  const node = document.querySelector<E>(selector)
  if (node === null) throw new Error(`demo.html is missing ${selector}`)
  return node
}

/** Draw both sheets for one character and hand back object URLs. */
async function drawSheets(id: string): Promise<SheetUrls> {
  const config = castConfig(id)
  if (config === undefined) throw new Error(`no such character: ${id}`)
  const createCanvas = canvasFactory()
  const poses = renderSheet(config, 'directions', { cell: CELL, createCanvas })
  const moods = renderSheet(config, 'reactions', { cell: CELL, createCanvas })
  const directions = await rawImageToBlob(poses, 'image/webp')
  const type = directions.type === 'image/webp' ? 'image/webp' : 'image/png'
  const reactions = await rawImageToBlob(moods, type)
  return { directions: URL.createObjectURL(directions), reactions: URL.createObjectURL(reactions) }
}

const store = createSheetStore({ make: drawSheets, revoke: (url) => URL.revokeObjectURL(url) })
window.addEventListener('pagehide', () => store.dispose())

const mascot = must<HTMLElement>('#plot-buddy')
const picker = must<HTMLElement>('#buddy-picker')
const status = must<HTMLElement>('#buddy-status')
const sizeInput = must<HTMLInputElement>('#buddy-size')
const sizeValue = must<HTMLElement>('#buddy-size-value')
const roleText = must<HTMLElement>('#buddy-role')
const copyButton = must<HTMLButtonElement>('#buddy-copy')
const copyResult = must<HTMLElement>('#buddy-copy-result')
const codeBlock = must<HTMLElement>('#buddy-code')

let currentId = DEMO_CAST[0]?.id ?? 'fox'

/** Build the picker from the cast, so the markup never lists them twice. */
function buildPicker(): void {
  for (const member of DEMO_CAST) {
    const option = document.createElement('span')
    option.className = 'buddy-option'
    const input = document.createElement('input')
    input.type = 'radio'
    input.name = 'buddy'
    input.id = `buddy-${member.id}`
    input.value = member.id
    input.checked = member.id === currentId
    const label = document.createElement('label')
    label.htmlFor = input.id
    label.append(member.name)
    option.append(input, label)
    picker.append(option)
    input.addEventListener('change', () => {
      if (input.checked) void choose(member.id)
    })
  }
}

function describe(id: string): void {
  const member = castMember(id)
  if (member === undefined) return
  roleText.textContent = `${member.name}. ${member.role}.`
  mascot.setAttribute('label', member.name)
}

async function choose(id: string): Promise<void> {
  currentId = id
  describe(id)
  status.textContent = 'Drawing…'
  try {
    const urls = await store.get(id)
    if (currentId !== id) return
    mascot.setAttribute('directions', urls.directions)
    mascot.setAttribute('reactions', urls.reactions)
    status.textContent = ''
    mascot.classList.add('is-ready')
    showSnippet()
  } catch (error: unknown) {
    status.textContent = error instanceof Error
      ? `The mascot could not be drawn: ${error.message}`
      : 'The mascot could not be drawn.'
  }
}

/** Keep the shown code in step with what is actually running on the page. */
function showSnippet(): void {
  codeBlock.textContent = currentSnippet()
}

function currentSnippet(): string {
  const member = castMember(currentId)
  return htmlSnippet({
    label: member?.name ?? 'mascot',
    slug: currentId,
    extension: 'webp',
    size: Number(sizeInput.value),
  })
}

sizeInput.addEventListener('input', () => {
  const size = sizeInput.value
  mascot.setAttribute('size', size)
  sizeValue.textContent = `${size}px`
  showSnippet()
})

copyButton.addEventListener('click', () => {
  navigator.clipboard.writeText(currentSnippet()).then(
    () => {
      copyResult.textContent = 'Embed code copied.'
    },
    () => {
      copyResult.textContent = 'The browser blocked the clipboard. Select the code instead.'
    },
  )
})

applyStoredTheme()
watchTheme(must<HTMLButtonElement>('#theme-toggle'))
buildPicker()
sizeValue.textContent = `${sizeInput.value}px`
mascot.setAttribute('size', sizeInput.value)
showSnippet()
void choose(currentId)
