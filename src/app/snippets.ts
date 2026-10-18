/**
 * The copy-and-paste snippets the Export panel hands out, and the escaping they
 * need.
 *
 * The mascot's name is typed by whoever is using the app, and it ends up in an
 * HTML attribute, a JSX attribute and a file name. Each of those three has a
 * different way of being broken out of, so each gets its own escape rather than
 * one "sanitise" pass that half-fits all three.
 */
import type { SheetKind } from '../studio'

export type SheetExtension = 'webp' | 'png'

/** The two runtime files the app offers for download. */
export const ELEMENT_FILE = 'mascotry-mascot.js'
export const REACT_FILE = 'mascotry-react.js'

export interface SnippetInput {
  /** As typed. Escaped here, not before. */
  readonly label: string
  readonly slug: string
  readonly extension: SheetExtension
  readonly size: number
}

const SLUG_MAX = 32
const FALLBACK = 'mascot'

/**
 * A file-name stem. Everything outside `[a-z0-9]` becomes a hyphen, which
 * removes path separators, dots and traversal along with the rest, so the name
 * cannot steer where a download lands.
 */
export function fileSlug(raw: string): string {
  const hyphenated = raw.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const trimmed = hyphenated.slice(0, SLUG_MAX).replace(/^-+|-+$/g, '')
  return trimmed.length > 0 ? trimmed : FALLBACK
}

/**
 * A label fit for one line of an attribute: whitespace collapsed first (so a
 * tab becomes a space rather than vanishing), then control characters removed.
 */
export function cleanLabel(raw: string): string {
  const flat = raw.replace(/\s+/g, ' ').replace(/[\p{Cc}\p{Cf}]/gu, '').trim()
  return flat.length > 0 ? flat : FALLBACK
}

/** Escape for a double-quoted HTML attribute. The ampersand goes first. */
export function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Escape for a double-quoted JSX attribute. JSX decodes HTML entities in string
 * attributes, so the braces can go through as entities and still read back as
 * braces — which keeps them out of the way of JSX's own expression syntax.
 */
export function escapeJsxAttribute(value: string): string {
  return escapeAttribute(value).replace(/\{/g, '&#123;').replace(/\}/g, '&#125;')
}

export function sheetFileName(slug: string, kind: SheetKind, extension: SheetExtension): string {
  return `${slug}-${kind}.${extension}`
}

function sheetPaths(input: SnippetInput): { readonly directions: string; readonly reactions: string } {
  return {
    directions: `/${sheetFileName(input.slug, 'directions', input.extension)}`,
    reactions: `/${sheetFileName(input.slug, 'reactions', input.extension)}`,
  }
}

/** Plain HTML, using the custom element. No framework, no build step. */
export function htmlSnippet(input: SnippetInput): string {
  const { directions, reactions } = sheetPaths(input)
  const label = escapeAttribute(cleanLabel(input.label))
  return [
    `<script type="module" src="/${ELEMENT_FILE}"></script>`,
    '',
    '<mascotry-mascot',
    `  directions="${directions}"`,
    `  reactions="${reactions}"`,
    `  size="${input.size}"`,
    `  label="${label}"></mascotry-mascot>`,
  ].join('\n')
}

/** React, using the component the app previews with. */
export function reactSnippet(input: SnippetInput): string {
  const { directions, reactions } = sheetPaths(input)
  const label = escapeJsxAttribute(cleanLabel(input.label))
  return [
    `import { Mascot } from './${REACT_FILE}'`,
    '',
    '<Mascot',
    `  directions="${directions}"`,
    `  reactions="${reactions}"`,
    `  size={${input.size}}`,
    `  label="${label}"`,
    '/>',
  ].join('\n')
}
