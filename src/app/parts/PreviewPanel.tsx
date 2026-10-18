import { Mascot } from '../../runtime/Mascot'
import type { Backdrop } from '../state/reducer'
import { PREVIEW_MAX, PREVIEW_MIN } from '../state/reducer'
import type { UrlPair } from '../hooks/useBlobUrls'

const BACKDROPS: readonly { readonly id: Backdrop; readonly label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'checker', label: 'Checkerboard' },
]

interface PreviewPanelProps {
  readonly urls: UrlPair | null
  readonly name: string
  readonly size: number
  readonly backdrop: Backdrop
  readonly busy: boolean
  readonly onSize: (size: number) => void
  readonly onBackdrop: (backdrop: Backdrop) => void
}

/**
 * The live mascot, on the three backgrounds worth checking.
 *
 * The checkerboard is the default because it is the only one that shows where
 * the transparency actually is, which is the thing most likely to be wrong.
 */
export function PreviewPanel({
  urls, name, size, backdrop, busy, onSize, onBackdrop,
}: PreviewPanelProps): React.JSX.Element {
  return (
    <div className="preview">
      <div className={`stage stage-${backdrop}`} style={{ minHeight: PREVIEW_MAX + 32 }}>
        {urls === null
          ? <p className="stage-empty">{busy ? 'Drawing the first pose…' : 'No drawing yet.'}</p>
          : (
            <Mascot
              directions={urls.directions}
              reactions={urls.reactions}
              size={size}
              label={name.trim().length > 0 ? name : 'mascot'}
            />
          )}
      </div>

      <p className="hint">Move the pointer to make it look about. Click it to poke it.</p>

      <p className="field">
        <label className="field-label" htmlFor="preview-size">Size on the page: {size}px</label>
        <input
          id="preview-size"
          className="range"
          type="range"
          min={PREVIEW_MIN}
          max={PREVIEW_MAX}
          step={8}
          value={size}
          onChange={(event) => onSize(Number(event.target.value))}
        />
      </p>

      <fieldset className="group">
        <legend className="group-title">Backdrop</legend>
        <div className="segmented">
          {BACKDROPS.map((option) => (
            <span className="segment" key={option.id}>
              <input
                id={`backdrop-${option.id}`}
                type="radio"
                name="backdrop"
                value={option.id}
                checked={backdrop === option.id}
                onChange={() => onBackdrop(option.id)}
              />
              <label htmlFor={`backdrop-${option.id}`}>{option.label}</label>
            </span>
          ))}
        </div>
      </fieldset>
    </div>
  )
}
