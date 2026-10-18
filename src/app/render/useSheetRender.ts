/**
 * Keeps the rendered sheets in step with the config, off the main thread where
 * that is possible.
 *
 * A worker is started on first use and kept. If one cannot be started — an
 * older browser, a test environment, a page served somewhere workers are not
 * allowed — the same render runs inline instead, so the app degrades to slower
 * rather than broken.
 *
 * Nothing here decides whether a result is still wanted. Every request carries
 * the revision it was made for and every answer carries it back, and the
 * reducer drops answers for a revision that has moved on. That keeps the
 * cancellation rule in one testable place.
 */
import { useEffect, useRef } from 'react'
import type { Dispatch } from 'react'
import type { StudioConfig } from '../../studio'
import type { AppAction } from '../state/reducer'
import type { RenderRequest, RenderResponse } from './protocol'
import { renderSheetPair } from './sheets'

function startWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null
  try {
    return new Worker(new URL('./render.worker.ts', import.meta.url), { type: 'module' })
  } catch {
    // No module workers here. The inline path below does the same work.
    return null
  }
}

function toAction(answer: RenderResponse): AppAction {
  return answer.ok
    ? {
        type: 'renderFinished',
        revision: answer.id,
        sheets: { directions: answer.directions, reactions: answer.reactions, mime: answer.mime },
      }
    : { type: 'renderFailed', revision: answer.id, message: answer.message }
}

export function useSheetRender(
  config: StudioConfig,
  cell: number,
  revision: number,
  dispatch: Dispatch<AppAction>,
): void {
  const workerRef = useRef<Worker | null>(null)
  const startedRef = useRef(false)

  // One worker for the life of the page, torn down with it.
  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true
      workerRef.current = startWorker()
    }
    const worker = workerRef.current
    if (worker === null) return undefined
    const onMessage = (event: MessageEvent<RenderResponse>): void => dispatch(toAction(event.data))
    const onError = (event: ErrorEvent): void => {
      dispatch({ type: 'renderFailed', revision, message: event.message || 'The render worker stopped.' })
    }
    worker.addEventListener('message', onMessage)
    worker.addEventListener('error', onError)
    return () => {
      worker.removeEventListener('message', onMessage)
      worker.removeEventListener('error', onError)
    }
  }, [dispatch, revision])

  useEffect(() => {
    dispatch({ type: 'renderStarted' })
    const request: RenderRequest = { id: revision, config, cell }
    const worker = workerRef.current
    if (worker !== null) {
      worker.postMessage(request)
      return
    }
    let live = true
    renderSheetPair(config, cell).then(
      (pair) => {
        if (live) dispatch(toAction({ id: revision, ok: true, ...pair }))
      },
      (error: unknown) => {
        const message = error instanceof Error ? error.message : 'The drawing failed.'
        if (live) dispatch({ type: 'renderFailed', revision, message })
      },
    )
    return () => {
      live = false
    }
  }, [config, cell, revision, dispatch])

  useEffect(
    () => () => {
      workerRef.current?.terminate()
      workerRef.current = null
    },
    [],
  )
}
