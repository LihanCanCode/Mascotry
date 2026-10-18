import { useCallback, useMemo, useReducer, useRef } from 'react'
import type { StudioConfig } from '../studio'
import { Mascot } from '../runtime/Mascot'
import { useBlobUrls } from './hooks/useBlobUrls'
import { useSheetRender } from './render/useSheetRender'
import { createThumbCache } from './state/thumbs'
import { initialState, reduce } from './state/reducer'
import type { Backdrop, Resolution } from './state/reducer'
import { fileSlug } from './snippets'
import { ExportPanel } from './parts/ExportPanel'
import { PickGrid } from './parts/PickGrid'
import { PreviewPanel } from './parts/PreviewPanel'
import { TunePanel } from './parts/TunePanel'
import { ThemeToggle } from './parts/ThemeToggle'

const HERO_SIZE = 180

/** What the live region says, so the state of the drawing is never only visual. */
function announcement(phase: string, error: string | null): string {
  if (phase === 'rendering') return 'Drawing the mascot.'
  if (phase === 'failed') return error ?? 'The drawing failed.'
  if (phase === 'ready') return 'The mascot is ready.'
  return ''
}

export function App(): React.JSX.Element {
  const [state, dispatch] = useReducer(reduce, initialState)
  const cache = useRef(createThumbCache()).current

  useSheetRender(state.config, state.resolution, state.revision, dispatch)
  const urls = useBlobUrls(state.sheets)

  const label = state.name.trim().length > 0 ? state.name : 'mascot'
  const slug = useMemo(() => fileSlug(state.name), [state.name])
  const busy = state.phase === 'rendering'

  const onPick = useCallback((id: string) => dispatch({ type: 'pickPreset', id }), [])
  const onName = useCallback((name: string) => dispatch({ type: 'setName', name }), [])
  const onTune = useCallback((patch: Partial<StudioConfig>) => dispatch({ type: 'setConfig', patch }), [])
  const onSize = useCallback((size: number) => dispatch({ type: 'setPreviewSize', size }), [])
  const onBackdrop = useCallback((backdrop: Backdrop) => dispatch({ type: 'setBackdrop', backdrop }), [])
  const onResolution = useCallback((resolution: Resolution) => dispatch({ type: 'setResolution', resolution }), [])

  return (
    <>
      <a className="skip" href="#pick">Skip to the characters</a>

      <header className="masthead">
        <p className="wordmark">
          <span className="wordmark-grid" aria-hidden="true">
            {Array.from({ length: 9 }, (_, i) => <i key={i} />)}
          </span>
          Mascotry
        </p>
        <ThemeToggle />
      </header>

      <main>
        <section className="hero">
          <div className="hero-words">
            <h1>Draw a mascot that watches the reader.</h1>
            <p className="lead">
              Pick a character, change its face, and leave with two sprite sheets and the fifteen lines
              that make them follow the cursor. It all happens in this tab — nothing is uploaded, and
              there is nothing to pay for.
            </p>
            <p className="hero-actions">
              <a className="button button-loud" href="#pick">Start with a character</a>
              <a className="button button-quiet" href="/demo.html">See one in use</a>
            </p>
          </div>
          <div className="hero-stage">
            <div className="sheet3">
              {urls === null
                ? <p className="stage-empty">Drawing…</p>
                : <Mascot directions={urls.directions} reactions={urls.reactions} size={HERO_SIZE} label={label} />}
            </div>
            <p className="hero-caption">
              {urls === null ? 'The first pose is being drawn.' : 'That is live. Poke it.'}
            </p>
          </div>
        </section>

        <p className="status" role="status" aria-live="polite">{announcement(state.phase, state.error)}</p>
        {state.phase === 'failed' && state.error !== null
          ? <p className="alarm">{state.error} Try a different part or reload the page.</p>
          : null}

        <section className="step" id="pick" aria-labelledby="pick-title">
          <h2 id="pick-title"><span className="step-no" aria-hidden="true">1</span>Pick a character</h2>
          <p className="step-note">Fourteen to start from. Every one of them is drawn by code, here, as you scroll.</p>
          <PickGrid pickedId={state.presetId} cache={cache} onPick={onPick} />
        </section>

        <div className="bench">
          <section className="step" id="tune" aria-labelledby="tune-title">
            <h2 id="tune-title"><span className="step-no" aria-hidden="true">2</span>Tune it</h2>
            <p className="step-note">Every change redraws all eighteen poses.</p>
            <TunePanel config={state.config} name={state.name} onName={onName} onChange={onTune} />
          </section>

          <section className="step step-sticky" id="preview" aria-labelledby="preview-title">
            <h2 id="preview-title"><span className="step-no" aria-hidden="true">3</span>Check it</h2>
            <PreviewPanel
              urls={urls}
              name={label}
              size={state.previewSize}
              backdrop={state.backdrop}
              busy={busy}
              onSize={onSize}
              onBackdrop={onBackdrop}
            />
          </section>
        </div>

        <section className="step" id="export" aria-labelledby="export-title">
          <h2 id="export-title"><span className="step-no" aria-hidden="true">4</span>Take it with you</h2>
          <p className="step-note">Four files and a snippet. Drop them on any static host.</p>
          <ExportPanel
            urls={urls}
            mime={state.sheets?.mime ?? null}
            slug={slug}
            name={state.name}
            size={state.previewSize}
            resolution={state.resolution}
            onResolution={onResolution}
          />
        </section>
      </main>

      <footer className="footer">
        <p>
          Mascotry is free, MIT-licensed and entirely original work. The characters are drawn by code in
          this repository, so there is no artwork to license and nothing to attribute.
        </p>
      </footer>
    </>
  )
}
