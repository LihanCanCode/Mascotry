import { useState } from 'react'
import { RESOLUTIONS } from '../state/reducer'
import type { Resolution, SheetMime } from '../state/reducer'
import type { UrlPair } from '../hooks/useBlobUrls'
import { ELEMENT_FILE, REACT_FILE, htmlSnippet, reactSnippet, sheetFileName } from '../snippets'
import type { SheetExtension } from '../snippets'
import { CopyButton } from './CopyButton'

type Flavour = 'html' | 'react'

const RUNTIME_DOWNLOADS: readonly { readonly file: string; readonly title: string; readonly note: string }[] = [
  { file: ELEMENT_FILE, title: 'For any page', note: 'One ES module. Adds <mascotry-mascot>. No build step.' },
  { file: REACT_FILE, title: 'For React', note: 'Exports <Mascot>. React stays yours to provide.' },
]

export function extensionOf(mime: SheetMime): SheetExtension {
  return mime === 'image/webp' ? 'webp' : 'png'
}

interface ExportPanelProps {
  readonly urls: UrlPair | null
  readonly mime: SheetMime | null
  readonly slug: string
  readonly name: string
  readonly size: number
  readonly resolution: Resolution
  readonly onResolution: (resolution: Resolution) => void
  /** The visitor actually left with something: a file saved, or the snippet copied. */
  readonly onTake: () => void
}

/**
 * Everything needed to leave with: the two sheets, the two runtime files, and
 * the two lines of markup that join them up.
 *
 * The file names carry the extension the browser actually encoded, not the one
 * that was asked for. WebP is tried first and a browser without it gets PNG, so
 * promising `.webp` in a snippet next to a file that is really PNG would break
 * the page it was pasted into.
 */
export function ExportPanel({
  urls, mime, slug, name, size, resolution, onResolution, onTake,
}: ExportPanelProps): React.JSX.Element {
  const [flavour, setFlavour] = useState<Flavour>('html')
  const extension = extensionOf(mime ?? 'image/webp')
  const input = { label: name, slug, extension, size }
  const code = flavour === 'html' ? htmlSnippet(input) : reactSnippet(input)

  return (
    <div className="export">
      <fieldset className="group">
        <legend className="group-title">Resolution, per pose</legend>
        <div className="segmented">
          {RESOLUTIONS.map((option) => (
            <span className="segment" key={option}>
              <input
                id={`resolution-${option}`}
                type="radio"
                name="resolution"
                checked={resolution === option}
                onChange={() => onResolution(option)}
              />
              <label htmlFor={`resolution-${option}`}>{option}px</label>
            </span>
          ))}
        </div>
        <p className="field-hint">Each sheet comes out {resolution * 3}px square: three poses by three.</p>
      </fieldset>

      <div className="downloads">
        <h3 className="sub">The two sheets</h3>
        {urls === null
          ? <p className="hint">They will appear here once the drawing finishes.</p>
          : (
            <p className="download-row">
              <a
                className="button"
                href={urls.directions}
                download={sheetFileName(slug, 'directions', extension)}
                onClick={onTake}
              >
                Download poses
                <span className="button-note">{sheetFileName(slug, 'directions', extension)}</span>
              </a>
              <a
                className="button"
                href={urls.reactions}
                download={sheetFileName(slug, 'reactions', extension)}
                onClick={onTake}
              >
                Download moods
                <span className="button-note">{sheetFileName(slug, 'reactions', extension)}</span>
              </a>
            </p>
          )}

        <h3 className="sub">The two runtime files</h3>
        <p className="download-row">
          {RUNTIME_DOWNLOADS.map((item) => (
            <a
              className="button button-quiet"
              href={`/${item.file}`}
              download={item.file}
              key={item.file}
              onClick={onTake}
            >
              {item.title}
              <span className="button-note">{item.note}</span>
            </a>
          ))}
        </p>
      </div>

      <div className="snippet">
        <div className="tabs" role="tablist" aria-label="Snippet language">
          <button
            type="button" role="tab" id="tab-html" aria-selected={flavour === 'html'} aria-controls="snippet-code"
            tabIndex={flavour === 'html' ? 0 : -1} className="tab" onClick={() => setFlavour('html')}
          >
            Plain HTML
          </button>
          <button
            type="button" role="tab" id="tab-react" aria-selected={flavour === 'react'} aria-controls="snippet-code"
            tabIndex={flavour === 'react' ? 0 : -1} className="tab" onClick={() => setFlavour('react')}
          >
            React
          </button>
        </div>
        <pre
          className="code" id="snippet-code" role="tabpanel" tabIndex={0}
          aria-labelledby={flavour === 'html' ? 'tab-html' : 'tab-react'}
        >
          <code>{code}</code>
        </pre>
        <CopyButton
          text={code}
          what={flavour === 'html' ? 'the HTML snippet' : 'the React snippet'}
          onCopied={onTake}
        />
      </div>
    </div>
  )
}
