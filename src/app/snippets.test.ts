import {
  ELEMENT_FILE, REACT_FILE, cleanLabel, escapeAttribute, fileSlug, htmlSnippet, reactSnippet, sheetFileName,
} from './snippets'

/** Things a person could plausibly type, and things an attacker would. */
const HOSTILE = [
  '" onload="alert(1)',
  "' onfocus='alert(1)",
  '</script><script>alert(1)</script>',
  '</mascotry-mascot><img src=x onerror=alert(1)>',
  '<svg/onload=alert(1)>',
  '{alert(1)}',
  '`${alert(1)}`',
  '\\" + alert(1) + \\"',
  '&lt;already escaped&gt;',
  '&amp;&quot;&#39;',
  'line one\nline two',
  'tab\there',
  'null\u0000byte',
  '../../etc/passwd',
  'Ünïcødé 🦊 名前',
  'a'.repeat(300),
]

const base = { label: 'Pip', slug: 'pip', extension: 'webp', size: 128 } as const

const ENTITIES: Readonly<Record<string, string>> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#123;': '{', '&#125;': '}',
}

/** The raw text between `label="` and the quote that ends it. */
function attributeValue(code: string): string {
  const open = code.indexOf('label="') + 'label="'.length
  const rest = code.slice(open)
  return rest.slice(0, rest.indexOf('"'))
}

/** What a browser or JSX would read the attribute back as. */
function decode(value: string): string {
  return value.replace(/&(?:amp|lt|gt|quot|#39|#123|#125);/g, (entity) => ENTITIES[entity] ?? entity)
}

/** True when every ampersand in the text begins an entity we know. */
function onlyKnownEntities(value: string): boolean {
  return !/&(?!(?:amp|lt|gt|quot|#39|#123|#125);)/.test(value)
}

describe('fileSlug', () => {
  it('lowercases and hyphenates a readable name', () => {
    expect(fileSlug('Pip & Co')).toBe('pip-co')
    expect(fileSlug('Bun')).toBe('bun')
  })

  it('strips path separators and traversal, so the name cannot steer a save', () => {
    expect(fileSlug('../../etc/passwd')).toBe('etc-passwd')
    expect(fileSlug('C:\\Windows\\System32')).toBe('c-windows-system32')
  })

  it('falls back to a usable name when nothing survives', () => {
    expect(fileSlug('')).toBe('mascot')
    expect(fileSlug('.....')).toBe('mascot')
    expect(fileSlug('   ')).toBe('mascot')
    expect(fileSlug('🦊')).toBe('mascot')
  })

  it('keeps the slug short enough for any filesystem', () => {
    expect(fileSlug('a'.repeat(300)).length).toBeLessThanOrEqual(32)
  })

  it.each(HOSTILE)('yields only lowercase letters, digits and hyphens for %j', (raw) => {
    expect(fileSlug(raw)).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })
})

describe('cleanLabel', () => {
  it('collapses whitespace so a label cannot break out of one line', () => {
    expect(cleanLabel('line one\nline two')).toBe('line one line two')
    expect(cleanLabel('tab\there')).toBe('tab here')
  })

  it('removes control characters', () => {
    expect(cleanLabel('null\u0000byte')).toBe('nullbyte')
  })

  it('keeps letters from any script', () => {
    expect(cleanLabel('Ünïcødé 名前')).toBe('Ünïcødé 名前')
  })

  it('offers a readable stand-in for an empty label', () => {
    expect(cleanLabel('')).toBe('mascot')
    expect(cleanLabel('   ')).toBe('mascot')
  })
})

describe('escapeAttribute', () => {
  it('escapes the five characters that can end an attribute or a tag', () => {
    expect(escapeAttribute(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;')
  })

  it('escapes the ampersand first, so an escape is not double-read', () => {
    expect(escapeAttribute('&lt;')).toBe('&amp;lt;')
  })

  it.each(HOSTILE)('leaves no raw quote, angle bracket or ampersand for %j', (raw) => {
    const out = escapeAttribute(raw)
    expect(out).not.toMatch(/["'<>]/)
    expect(out.replace(/&(amp|lt|gt|quot|#39);/g, '')).not.toContain('&')
  })
})

describe('sheetFileName', () => {
  it('names the sheet after the mascot, the sheet kind and the real format', () => {
    expect(sheetFileName('pip', 'directions', 'webp')).toBe('pip-directions.webp')
    expect(sheetFileName('pip', 'reactions', 'png')).toBe('pip-reactions.png')
  })
})

describe('htmlSnippet', () => {
  it('loads the element and places it, naming both sheets', () => {
    const code = htmlSnippet(base)
    expect(code).toContain(`src="/${ELEMENT_FILE}"`)
    expect(code).toContain('<mascotry-mascot')
    expect(code).toContain('directions="/pip-directions.webp"')
    expect(code).toContain('reactions="/pip-reactions.webp"')
    expect(code).toContain('size="128"')
    expect(code).toContain('label="Pip"')
  })

  it('uses the extension the files were actually saved with', () => {
    expect(htmlSnippet({ ...base, extension: 'png' })).toContain('directions="/pip-directions.png"')
  })

  it('closes the element explicitly, since a custom element has no void form', () => {
    expect(htmlSnippet(base)).toContain('</mascotry-mascot>')
  })

  it.each(HOSTILE)('cannot be broken out of by the label %j', (label) => {
    const code = htmlSnippet({ ...base, label })
    // One script tag, the one we wrote. No second one smuggled in by the label.
    expect(code.match(/<script/g)).toHaveLength(1)
    expect(code.match(/<\/script>/g)).toHaveLength(1)
    expect(code.match(/<mascotry-mascot/g)).toHaveLength(1)
    expect(code.match(/<\/mascotry-mascot>/g)).toHaveLength(1)
    // The label survives intact, but only as entities: nothing raw escapes the attribute.
    const value = attributeValue(code)
    expect(value).not.toMatch(/[<>"']/u)
    expect(onlyKnownEntities(value)).toBe(true)
    expect(decode(value)).toBe(cleanLabel(label))
  })

  it('still produces a valid element when the label is empty', () => {
    expect(htmlSnippet({ ...base, label: '' })).toContain('label="mascot"')
  })
})

describe('reactSnippet', () => {
  it('imports the component and passes both sheets', () => {
    const code = reactSnippet(base)
    expect(code).toContain(`from './${REACT_FILE}'`)
    expect(code).toContain('<Mascot')
    expect(code).toContain('directions="/pip-directions.webp"')
    expect(code).toContain('size={128}')
    expect(code).toContain('label="Pip"')
  })

  it.each(HOSTILE)('cannot be broken out of by the label %j', (label) => {
    const code = reactSnippet({ ...base, label })
    const value = attributeValue(code)
    // Braces go out as entities too, so the label can never read as a JSX expression.
    expect(value).not.toMatch(/[<>"'{}]/u)
    expect(onlyKnownEntities(value)).toBe(true)
    expect(decode(value)).toBe(cleanLabel(label))
    expect(code.match(/<Mascot/g)).toHaveLength(1)
    expect(code.split('\n').some((line) => line.trim() === '/>')).toBe(true)
  })

  it('keeps the size a JSX number rather than a string', () => {
    expect(reactSnippet({ ...base, size: 256 })).toContain('size={256}')
    expect(reactSnippet({ ...base, size: 256 })).not.toContain('size="256"')
  })
})
