/**
 * `<mascotry-mascot>` — the mascot with no framework behind it.
 *
 * This is the same behaviour as the React component, driven by the same two
 * modules: `aim` turns a pointer offset into one of nine poses, `poke` decides
 * which mood a poke shows. Neither calculation is repeated here, so the element
 * and the component cannot drift apart, and a test sweeps the pointer across a
 * grid of offsets to prove they agree.
 *
 * Everything is set through the CSSOM rather than written as stylesheet text,
 * so the element works under a Content-Security-Policy that has no
 * `'unsafe-inline'` in `style-src`. A page serving this file needs no build
 * step and no other script.
 */
import { CENTRE_CELL, aimCell, cellPosition, normaliseSettings, type AimSettings } from './aim'
import { INITIAL_POKE, poke, type PokeState } from './poke'

export const MASCOTRY_TAG = 'mascotry-mascot'

const DEFAULT_SIZE = 128
const MIN_SIZE = 16
const MAX_SIZE = 1024
const SQUASH_MS = 320
const FINE_POINTER = '(hover: hover) and (pointer: fine)'
const LESS_MOTION = '(prefers-reduced-motion: reduce)'

/** Rules that cannot be expressed on an element's own style declaration. */
const RULES: readonly string[] = [
  'button:focus-visible { outline: 3px solid currentColor; outline-offset: 3px; border-radius: 4px; }',
]

function prefers(query: string): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(query).matches
    : false
}

/**
 * JSON quoting escapes exactly the backslashes and double quotes that would
 * otherwise end the `url("...")` early, which is what CSS wants too.
 */
function cssUrl(href: string): string {
  return `url(${JSON.stringify(href)})`
}

function clampSize(raw: string | null): number {
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_SIZE
  return Math.min(Math.max(Math.round(parsed), MIN_SIZE), MAX_SIZE)
}

/**
 * A numeric attribute, or null when it is absent or unusable. Going through
 * `Number()` alone will not do: `Number(null)` is 0, which would read a missing
 * attribute as a deliberate zero.
 */
function numberAttribute(host: Element, name: string): number | null {
  const raw = host.getAttribute(name)
  if (raw === null || raw.trim() === '') return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

function readAim(host: Element): AimSettings {
  const commit = numberAttribute(host, 'commit')
  const release = numberAttribute(host, 'release')
  return normaliseSettings({
    ...(commit !== null && commit > 0 ? { commit } : {}),
    ...(release !== null && release >= 0 ? { release } : {}),
  })
}

/**
 * Put the rules in through a constructed sheet where that exists, and through
 * `insertRule` where it does not. If neither works the element still runs; it
 * just falls back to the browser's own focus ring, which is visible anyway.
 */
function applyRules(root: ShadowRoot): void {
  if (typeof CSSStyleSheet === 'function') {
    try {
      const sheet = new CSSStyleSheet()
      for (const rule of RULES) sheet.insertRule(rule, sheet.cssRules.length)
      const existing = root.adoptedStyleSheets ?? []
      const before = existing.length
      root.adoptedStyleSheets = [...existing, sheet]
      // Some engines accept the constructor but ignore the assignment, so the
      // sheet only counts as applied once it reads back.
      if (root.adoptedStyleSheets.length > before) return
    } catch {
      // No constructable stylesheets here; fall through to the style element.
    }
  }
  const tag = document.createElement('style')
  root.append(tag)
  const sheet = tag.sheet
  if (sheet === null) return
  for (const rule of RULES) sheet.insertRule(rule, sheet.cssRules.length)
}

function layer(): HTMLSpanElement {
  const span = document.createElement('span')
  span.setAttribute('aria-hidden', 'true')
  const style = span.style
  style.position = 'absolute'
  style.inset = '0'
  style.backgroundSize = '300% 300%'
  style.backgroundRepeat = 'no-repeat'
  style.backgroundPosition = cellPosition(CENTRE_CELL)
  style.transition = 'opacity 90ms linear'
  return span
}

export class MascotryMascot extends HTMLElement {
  static get observedAttributes(): readonly string[] {
    return ['directions', 'reactions', 'size', 'label', 'commit', 'release']
  }

  readonly #button: HTMLButtonElement
  readonly #poses: HTMLSpanElement
  readonly #moods: HTMLSpanElement

  #cell = CENTRE_CELL
  #mood: number | null = null
  #pokeState: PokeState = INITIAL_POKE
  #holdTimer: ReturnType<typeof setTimeout> | undefined
  #squashTimer: ReturnType<typeof setTimeout> | undefined
  #frame = 0
  #scheduled = false
  #latest: { readonly x: number; readonly y: number } | null = null
  #onMove: ((event: PointerEvent) => void) | null = null

  constructor() {
    super()
    const root = this.attachShadow({ mode: 'open' })
    this.#button = document.createElement('button')
    this.#button.type = 'button'
    this.#poses = layer()
    this.#moods = layer()
    this.#moods.style.opacity = '0'
    this.#button.append(this.#poses, this.#moods)
    root.append(this.#button)
    applyRules(root)
    this.#styleButton()
    this.#button.addEventListener('pointerdown', () => this.#poke())
  }

  connectedCallback(): void {
    this.style.display = 'inline-block'
    this.style.lineHeight = '0'
    this.#applySize()
    this.#applyLabel()
    this.#track()
  }

  disconnectedCallback(): void {
    if (this.#onMove !== null) window.removeEventListener('pointermove', this.#onMove)
    this.#onMove = null
    if (this.#scheduled) cancelAnimationFrame(this.#frame)
    this.#scheduled = false
    clearTimeout(this.#holdTimer)
    clearTimeout(this.#squashTimer)
    this.#holdTimer = undefined
    this.#squashTimer = undefined
  }

  attributeChangedCallback(name: string): void {
    if (name === 'directions') this.#poses.style.backgroundImage = cssUrl(this.getAttribute(name) ?? '')
    else if (name === 'reactions') this.#moods.style.backgroundImage = cssUrl(this.getAttribute(name) ?? '')
    else if (name === 'size') this.#applySize()
    else if (name === 'label') this.#applyLabel()
  }

  #styleButton(): void {
    const style = this.#button.style
    style.position = 'relative'
    style.display = 'block'
    style.width = '100%'
    style.height = '100%'
    style.padding = '0'
    style.border = '0'
    style.background = 'none'
    style.cursor = 'pointer'
    style.touchAction = 'manipulation'
    style.transition = `transform ${SQUASH_MS}ms cubic-bezier(.34,1.56,.64,1)`
  }

  #applySize(): void {
    const size = `${clampSize(this.getAttribute('size'))}px`
    this.style.width = size
    this.style.height = size
  }

  #applyLabel(): void {
    const label = (this.getAttribute('label') ?? '').trim()
    this.#button.setAttribute('aria-label', `Poke the ${label.length > 0 ? label : 'mascot'}`)
  }

  /** Follow the pointer, but only where there is a cursor to follow. */
  #track(): void {
    if (!prefers(FINE_POINTER)) return
    const onMove = (event: PointerEvent): void => {
      this.#latest = { x: event.clientX, y: event.clientY }
      if (this.#scheduled) return
      this.#scheduled = true
      this.#frame = requestAnimationFrame(() => this.#settle())
    }
    this.#onMove = onMove
    window.addEventListener('pointermove', onMove, { passive: true })
  }

  /** Pointer moves outrun frames, so the latest position is read once a frame. */
  #settle(): void {
    this.#scheduled = false
    const latest = this.#latest
    if (latest === null) return
    const box = this.getBoundingClientRect()
    const dx = latest.x - (box.left + box.width / 2)
    const dy = latest.y - (box.top + box.height / 2)
    this.#cell = aimCell(dx, dy, this.#cell, readAim(this))
    this.#poses.style.backgroundPosition = cellPosition(this.#cell)
  }

  #poke(): void {
    const result = poke(this.#pokeState, Date.now())
    this.#pokeState = result.state
    this.#showMood(result.cell)
    if (!prefers(LESS_MOTION)) this.#squash()
    clearTimeout(this.#holdTimer)
    this.#holdTimer = setTimeout(() => this.#showMood(null), result.hold)
  }

  #showMood(cell: number | null): void {
    this.#mood = cell
    if (cell !== null) this.#moods.style.backgroundPosition = cellPosition(cell)
    this.#moods.style.opacity = cell === null ? '0' : '1'
    this.#poses.style.opacity = cell === null ? '1' : '0'
  }

  #squash(): void {
    this.#button.style.transform = 'scale(1.06, 0.94)'
    clearTimeout(this.#squashTimer)
    this.#squashTimer = setTimeout(() => {
      this.#button.style.transform = 'scale(1, 1)'
    }, SQUASH_MS)
  }

  /** The mood on screen, or null when it is watching the pointer. Handy for tests. */
  get mood(): number | null {
    return this.#mood
  }
}

/** Define the element once. Two copies of this file on one page is harmless. */
export function defineMascotryElement(registry: CustomElementRegistry = customElements): void {
  if (registry.get(MASCOTRY_TAG) !== undefined) return
  registry.define(MASCOTRY_TAG, MascotryMascot)
}

if (typeof customElements !== 'undefined') defineMascotryElement()
