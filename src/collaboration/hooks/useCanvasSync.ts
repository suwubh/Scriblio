import { useEffect, useRef } from 'react'
import * as Y from 'yjs'
import { ScriblioElement } from '../../types/scriblio'
import { YjsDocumentManager, LOCAL_ORIGIN } from '../managers/YjsDocumentManager'

/**
 * Bridges local canvas element state with the shared Yjs document so a drawing
 * made by one collaborator shows up on every other peer in the same room.
 *
 * Local edits (draw / AI / panel / delete / clear) all flow through React
 * `elements` state — this hook diffs that state and writes the changes into the
 * shared `Y.Map`. Remote edits (and undo/redo replayed through the document)
 * arrive through the map observer and are applied back into local state.
 *
 * Invariants that keep this safe:
 *  - Deletes are derived from the *previous local elements*, never from the
 *    document, so content this client has not rendered yet can't be wiped.
 *  - Writes are tagged with a local origin and upserts are skipped when the
 *    value already matches the document, so re-emitting state we just received
 *    produces no echo.
 *  - When a remote update arrives, any local element created but not yet
 *    flushed to the document is merged back in, so a concurrent remote write
 *    can't drop an in-flight local shape.
 */
export function useCanvasSync(
  documentManager: YjsDocumentManager,
  elements: ScriblioElement[],
  applyRemoteElements: (elements: ScriblioElement[]) => void,
): void {
  // id -> JSON of what we believe is currently in the shared document.
  const docSnapshot = useRef<Map<string, string>>(new Map())
  // id -> JSON of the last local `elements` array this hook processed.
  const prevElements = useRef<Map<string, string>>(new Map())
  // Always-current local elements, readable from inside the observer closure.
  const elementsRef = useRef<ScriblioElement[]>(elements)
  elementsRef.current = elements

  // -------------------------------- remote -> local --------------------------------
  useEffect(() => {
    const map = documentManager.elementsMap

    const readAll = (): ScriblioElement[] => {
      const out: ScriblioElement[] = []
      map.forEach((value) => {
        if (value && typeof value === 'object' && typeof value.id === 'string') {
          out.push(value)
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

    const observer = (_event: Y.YMapEvent<ScriblioElement>, transaction: Y.Transaction) => {
      // Ignore the echo of our own writes.
      if (transaction.origin === LOCAL_ORIGIN) return

      const all = readAll()
      const inDocNow = new Set(all.map((el) => el.id))
      // The snapshot from *before* this event. An element that was never in it
      // is a brand-new local creation not yet flushed — keep it so a remote
      // update can't drop an in-flight shape. An element removed by undo or a
      // remote delete WAS in this snapshot, so it is correctly let go.
      const inDocBefore = docSnapshot.current
      const unflushed = elementsRef.current.filter(
        (el) => !inDocNow.has(el.id) && !inDocBefore.has(el.id),
      )

      docSnapshot.current = new Map(all.map((el) => [el.id, JSON.stringify(el)]))
      applyRemoteElements([...all, ...unflushed])
    }

    map.observe(observer)
    return () => map.unobserve(observer)
  }, [documentManager, applyRemoteElements])

  // -------------------------------- local -> remote --------------------------------
  useEffect(() => {
    const map = documentManager.elementsMap

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
    const toUpsert: ScriblioElement[] = []
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
