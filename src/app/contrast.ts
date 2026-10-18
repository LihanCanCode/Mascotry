/**
 * WCAG 2.2 relative-luminance and contrast maths, plus just enough CSS reading to
 * pull the theme tokens out of the stylesheet.
 *
 * The point of doing this in code rather than by eye is that the token file is the
 * single source of truth for colour, so a test can hold it to the contrast floors
 * instead of a human remembering to re-check them after a tweak.
 */

function channel(value: number): number {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** Relative luminance of a `#rrggbb` colour, per WCAG 2.x. */
export function luminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim())
  const digits = match?.[1]
  if (digits === undefined) throw new Error(`Not a 6-digit hex colour: ${hex}`)
  const n = Number.parseInt(digits, 16)
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
}

/** Contrast ratio between two `#rrggbb` colours, from 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const first = luminance(a)
  const second = luminance(b)
  const high = Math.max(first, second)
  const low = Math.min(first, second)
  return (high + 0.05) / (low + 0.05)
}

/** `--name: #rrggbb;` declarations inside one rule body. Non-colour tokens are ignored. */
export function parseTokens(block: string): Readonly<Record<string, string>> {
  const out: Record<string, string> = {}
  for (const match of block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    const [, name, value] = match
    if (name !== undefined && value !== undefined) out[name] = value
  }
  return out
}

/**
 * Body of the first rule whose selector is exactly `selector`.
 * Token rules hold no nested braces, so finding the next `}` is enough.
 */
export function ruleBody(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`)
  if (start < 0) throw new Error(`No rule found for selector: ${selector}`)
  const open = css.indexOf('{', start)
  const close = css.indexOf('}', open)
  if (close < 0) throw new Error(`Unterminated rule for selector: ${selector}`)
  return css.slice(open + 1, close)
}

export interface ThemeTokens {
  readonly light: Readonly<Record<string, string>>
  readonly dark: Readonly<Record<string, string>>
  /** True when the OS-preference dark block and the manual `[data-theme='dark']` block agree. */
  readonly darkBlocksAgree: boolean
}

/**
 * Reads both themes out of the token stylesheet. Dark is the light set with the
 * dark overrides applied, which is how the cascade resolves it in the browser.
 */
export function readThemes(css: string): ThemeTokens {
  const light = parseTokens(ruleBody(css, ':root'))
  const auto = parseTokens(ruleBody(css, ":root:not([data-theme='light'])"))
  const manual = parseTokens(ruleBody(css, ":root[data-theme='dark']"))
  return {
    light,
    dark: { ...light, ...manual },
    darkBlocksAgree: JSON.stringify(auto) === JSON.stringify(manual),
  }
}
