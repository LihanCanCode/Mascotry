/**
 * The render worker.
 *
 * Eighteen poses and two image encodes take long enough to drop frames, and a
 * dropped frame while somebody is dragging a colour slider is exactly the sort
 * of thing that makes an app feel broken. So the work happens here and the main
 * thread stays free to keep the controls moving.
 *
 * Requests are answered in order with the id they arrived with. Deciding which
 * answers still matter is the page's job, not this file's.
 */
import type { RenderRequest, RenderResponse } from './protocol'
import { renderSheetPair } from './sheets'

/**
 * The worker globals this file uses. Pulling in the whole WebWorker lib would
 * collide with the DOM lib the rest of the project is built against, and only
 * these two members are needed.
 */
interface WorkerScope {
  addEventListener(type: 'message', listener: (event: MessageEvent<RenderRequest>) => void): void
  postMessage(message: RenderResponse): void
}

const scope = self as unknown as WorkerScope

function failure(id: number, error: unknown): RenderResponse {
  return { id, ok: false, message: error instanceof Error ? error.message : 'The drawing failed.' }
}

scope.addEventListener('message', (event: MessageEvent<RenderRequest>) => {
  const { id, config, cell } = event.data
  renderSheetPair(config, cell).then(
    (pair) => {
      const answer: RenderResponse = { id, ok: true, ...pair }
      scope.postMessage(answer)
    },
    (error: unknown) => scope.postMessage(failure(id, error)),
  )
})
