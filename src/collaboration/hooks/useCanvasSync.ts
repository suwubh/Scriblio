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
 * Two invariants keep this safe:
 *  - Deletes are derived from the *previous local elements*, never from the
 *    document. So if the document already holds content this client has not
 *    rendered yet (just joined a room, or React StrictMode's double mount),
 *    the outbound diff can never wipe it.
 *  - Writes are tagged with a local origin and upserts are skipped when the
 *    value already matches the document, so re-emitting state we just received
 *    produces no echo.
 */
export function useCanvasSync(
  documentManager: YjsDocumentManager,
  elements: ExcalidrawElement[],
  applyRemoteElements: (elements: ExcalidrawElement[]) => void,
): void {
  // id -> JSON of what we believe is currently in the shared document.
  const docSnapshot = useRef<Map<string, string>>(new Map())
  // id -> JSON of the last local `elements` array this hook processed.
  const prevElements = useRef<Map<string, string>>(new Map())

  // -------------------------------- remote -> local --------------------------------
  useEffect(() => {
    const map = documentManager.elementsMap as unknown as Y.Map<ExcalidrawElement>

    const readAll = (): ExcalidrawElement[] => {
      const out: ExcalidrawElement[] = []
      map.forEach((value) => {
        if (
          value &&
          typeof value === 'object' &&
          typeof (value as ExcalidrawElement).id === 'string'
        ) {
          out.push(value as ExcalidrawElement)
        }
      })
      return out
    }

    const pullFromDoc = (apply: boolean) => {
      const all = readAll()
      docSnapshot.current = new Map(all.map((el) => [el.id, JSON.stringify(el)]))
      if (apply && all.length > 0) applyRemoteElements(all)
    }

    // Hydrate from whatever already exists in the room.
    pullFromDoc(true)

    const observer = (_event: Y.YMapEvent<ExcalidrawElement>, transaction: Y.Transaction) => {
      // Ignore the echo of our own writes.
      if (transaction.origin === LOCAL_ORIGIN) return
      const all = readAll()
      docSnapshot.current = new Map(all.map((el) => [el.id, JSON.stringify(el)]))
      applyRemoteElements(all)
    }

    map.observe(observer)
    return () => map.unobserve(observer)
  }, [documentManager, applyRemoteElements])

  // -------------------------------- local -> remote --------------------------------
  useEffect(() => {
    const map = documentManager.elementsMap as unknown as Y.Map<ExcalidrawElement>

    const current = new Map<string, string>()
    for (const el of elements) {
      current.set(el.id, JSON.stringify(el))
    }

    // Deletes: ids the local user actually had and removed. Driven by the
    // previous local state (never the document), so content we haven't
    // rendered yet is safe.
    const toDelete: string[] = []
    for (const id of prevElements.current.keys()) {
      if (!current.has(id) && docSnapshot.current.has(id)) {
        toDelete.push(id)
      }
    }

    // Upserts: created or changed elements that don't already match the doc.
    const toUpsert: ExcalidrawElement[] = []
    for (const el of elements) {
      if (docSnapshot.current.get(el.id) !== current.get(el.id)) {
        toUpsert.push(el)
      }
    }

    prevElements.current = current

    if (toDelete.length === 0 && toUpsert.length === 0) return

    documentManager.doc.transact(() => {
      for (const el of toUpsert) map.set(el.id, el)
      for (const id of toDelete) map.delete(id)
    }, LOCAL_ORIGIN)

    for (const el of toUpsert) {
      docSnapshot.current.set(el.id, current.get(el.id) as string)
    }
    for (const id of toDelete) {
      docSnapshot.current.delete(id)
    }
  }, [elements, documentManager])
}
