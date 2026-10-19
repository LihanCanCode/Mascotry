import { useCallback, useMemo, useRef, useState } from 'react'
import { analysePhoto, readPhoto } from '../../photo'
import type { PhotoReading } from '../../photo'
import { renderCell } from '../../studio'
import type { StudioConfig } from '../../studio'
import { canvasFactory } from '../../studio/browser'
import type { Pixels } from '../../image/types'
import { PixelCanvas } from './PixelCanvas'
import { PhotoReadout } from './PhotoReadout'

const THUMB = 132
/** Index 4 of the poses sheet is the straight-ahead look. */
const STRAIGHT_AHEAD = 4

interface PhotoPanelProps {
  readonly config: StudioConfig
  readonly reading: PhotoReading | null
  readonly onRead: (reading: PhotoReading) => void
  readonly onChange: (patch: Partial<StudioConfig>) => void
  /** Injected in tests, where there is no browser image decoder. */
  readonly decode?: (file: Blob) => Promise<Pixels>
}

/** The current character, drawn here so the photo and its result sit side by side. */
function characterThumb(config: StudioConfig): Pixels | null {
  try {
    return renderCell(config, 'directions', STRAIGHT_AHEAD, { cell: 128, createCanvas: canvasFactory() })
  } catch {
    return null
  }
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : 'That photo could not be read.'
}

/**
 * A photograph to a character, in this tab.
 *
 * The file is decoded with the browser's own image decoder and read off a
 * canvas; there is no request, no upload and no service, which the end-to-end
 * suite checks by failing on any off-origin request. What comes out is a
 * starting point with its confidences shown, not a portrait.
 */
export function PhotoPanel({ config, reading, onRead, onChange, decode }: PhotoPanelProps): React.JSX.Element {
  const [photo, setPhoto] = useState<Pixels | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [over, setOver] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const read = decode ?? readPhoto
  const character = useMemo(() => characterThumb(config), [config])

  const take = useCallback(
    async (file: Blob | undefined): Promise<void> => {
      if (file === undefined) return
      setBusy(true)
      setError(null)
      try {
        const pixels = await read(file)
        setPhoto(pixels)
        onRead(analysePhoto(pixels))
      } catch (failure: unknown) {
        setPhoto(null)
        setError(message(failure))
      } finally {
        setBusy(false)
      }
    },
    [onRead, read],
  )

  return (
    <div className="photo">
      <p className="step-note photo-promise">
        The photo is decoded in this tab and its pixels are read here. It is never uploaded, and it is not kept:
        nothing leaves the page. What you get is a cartoon that shares your colouring and features — not a portrait.
      </p>
      <p className="step-note photo-promise">
        It wants a <strong>head-and-shoulders photo</strong>: one face, filling much of the frame, against a plain
        background. Skin is found by its colour, and warm wood, beige walls and sand are the same colour as skin —
        in a room full of them there is no face to pick out, and it will say so rather than invent one.
      </p>

      <div
        className={over ? 'drop drop-over' : 'drop'}
        onDragOver={(event) => {
          event.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault()
          setOver(false)
          void take(event.dataTransfer.files[0])
        }}
      >
        <p className="drop-words">Drop a head-and-shoulders photo here</p>
        <p className="field">
          <label className="field-label" htmlFor="photo-file">or choose one</label>
          <input
            id="photo-file"
            ref={input}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(event) => void take(event.target.files?.[0])}
          />
          <span className="field-hint">Head and shoulders, plain background. PNG, JPEG, WebP or GIF.</span>
        </p>
      </div>

      <p className="status" role="status" aria-live="polite">
        {busy ? 'Reading the photo.' : ''}
      </p>
      {error === null ? null : <p className="alarm">{error}</p>}

      <div className="photo-pair">
        <figure className="photo-side">
          <figcaption className="photo-caption">The photo</figcaption>
          {photo === null
            ? <span className="card-art-empty" aria-hidden="true" />
            : <PixelCanvas image={photo} display={THUMB} alt="The photo you chose, as this page sees it" />}
        </figure>
        <figure className="photo-side">
          <figcaption className="photo-caption">The character</figcaption>
          {character === null
            ? <span className="card-art-empty" aria-hidden="true" />
            : <PixelCanvas image={character} display={THUMB} alt="The character read from the photo" />}
        </figure>
      </div>

      {reading === null
        ? null
        : <PhotoReadout reading={reading} config={config} onChange={onChange} />}
    </div>
  )
}
