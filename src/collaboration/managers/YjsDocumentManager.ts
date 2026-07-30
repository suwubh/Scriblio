import * as Y from 'yjs'
import { ScriblioElement } from '../../types/scriblio'

/** Transaction origin tag for writes made by the local user. */
export const LOCAL_ORIGIN = 'scriblio-local'

/**
 * Owns the shared Yjs document for a room.
 *
 * The canvas elements live in a single `Y.Map` keyed by element id. A
 * `Y.UndoManager` is scoped to the local origin tag, so undo/redo only ever
 * reverts *this* user's edits and never touches a collaborator's work.
 */
export class YjsDocumentManager {
  public doc: Y.Doc
  public elementsMap: Y.Map<ScriblioElement>
  public undoManager: Y.UndoManager

  constructor(roomId: string) {
    this.doc = new Y.Doc()
    this.elementsMap = this.doc.getMap(`elements-${roomId}`)
    this.undoManager = new Y.UndoManager(this.elementsMap, {
      trackedOrigins: new Set([LOCAL_ORIGIN]),
    })
  }

  destroy(): void {
    this.undoManager.destroy()
    this.doc.destroy()
  }
}
