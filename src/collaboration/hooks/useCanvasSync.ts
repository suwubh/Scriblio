import { useEffect, useRef } from 'react'
import * as Y from 'yjs'
import { ExcalidrawElement } from '../../types/excalidraw'
import { YjsDocumentManager } from '../managers/YjsDocumentManager'

/** Transaction origin tag for writes made by the local user. */
const LOCAL_ORIGIN = 'scriblio-local'

/**
 * Bridges local canvas element state with the shared Yjs document so a drawing
 * made by one collaborator shows up on every other peer in the same room.
 *
 * Local edits (draw / AI / panel / delete / clear / undo-redo) all flow through
 * React `elements` state — this hook diffs that state and writes the changes
 * into the shared `Y.Map`. Remote edits arrive through the map observer and are
 * applied back into local state, which re-renders the canvas.
 *
 * Echoes are avoided two ways: the observer ignores transactions tagged with
 * our own origin, and the outbound push is diff-based, so re-emitting state we
 * just received produces no writes.
 */
export function useCanvasSync(
  documentManager: YjsDocumentManager,
  elements: ExcalidrawElement[],
  applyRemoteElements: (elements: ExcalidrawElement[]) => void,
): void {
  // id -> JSON of the value we last know is in the shared document.
  const snapshot = useRef<Map<string, string>>(new Map())
  const skipFirstPush = useRef(true)

  // -------------------------------- remote -> local --------------------------------
  useEffect(() => {
    const map = documentManager.elementsMap as unknown as Y.Map<ExcalidrawElement>

    const readAll = (): ExcalidrawElement[] => {
      const result: ExcalidrawElement[] = []
      map.forEach((value) => {
        if (
          value &&
          typeof value === 'object' &&
          typeof (value as ExcalidrawElement).id === 'string'
        ) {
          result.push(value as ExcalidrawElement)
        }
      })
      return result
    }

    const refreshSnapshot = (els: ExcalidrawElement[]) => {
      snapshot.current = new Map(els.map((el) => [el.id, JSON.stringify(el)]))
    }

    // Hydrate from whatever already exists in the room.
    const initial = readAll()
    refreshSnapshot(initial)
    if (initial.length > 0) {
      applyRemoteElements(initial)
    }

    const observer = (_event: Y.YMapEvent<ExcalidrawElement>, transaction: Y.Transaction) => {
      // Ignore the echo of our own writes.
      if (transaction.origin === LOCAL_ORIGIN) return
      const all = readAll()
      refreshSnapshot(all)
      applyRemoteElements(all)
    }

    map.observe(observer)
    return () => map.unobserve(observer)
  }, [documentManager, applyRemoteElements])

  // -------------------------------- local -> remote --------------------------------
  useEffect(() => {
    // The first run is the initial mount. There is nothing local to push yet,
    // and pushing the empty array here would wipe a room we just joined.
    if (skipFirstPush.current) {
      skipFirstPush.current = false
      return
    }

    const map = documentManager.elementsMap as unknown as Y.Map<ExcalidrawElement>
    const previous = snapshot.current
    const next = new Map<string, string>()
    for (const el of elements) {
      next.set(el.id, JSON.stringify(el))
    }

    // Bail out early when nothing actually changed (this is what absorbs the
    // re-render caused by applying a remote update).
    let dirty = next.size !== previous.size
    if (!dirty) {
      for (const [id, json] of next) {
        if (previous.get(id) !== json) {
          dirty = true
          break
        }
      }
    }
    if (!dirty) return

    documentManager.doc.transact(() => {
      // Upsert created / changed elements.
      for (const el of elements) {
        if (previous.get(el.id) !== next.get(el.id)) {
          map.set(el.id, el)
        }
      }
      // Remove elements that no longer exist locally.
      for (const id of previous.keys()) {
        if (!next.has(id)) {
          map.delete(id)
        }
      }
    }, LOCAL_ORIGIN)

    snapshot.current = next
  }, [elements, documentManager])
}
