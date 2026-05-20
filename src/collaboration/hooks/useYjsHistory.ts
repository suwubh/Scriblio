import { useCallback, useEffect, useState } from 'react'
import { YjsDocumentManager } from '../managers/YjsDocumentManager'

/**
 * Undo/redo backed by the room's `Y.UndoManager`.
 *
 * Because the underlying manager only tracks transactions tagged with the
 * local origin, undo reverts this user's last edit while leaving every
 * collaborator's changes in place. The reverted change is written back into
 * the shared document, so it propagates to the other peers like any edit.
 */
export function useYjsHistory(documentManager: YjsDocumentManager) {
  const { undoManager } = documentManager
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  useEffect(() => {
    const sync = () => {
      setCanUndo(undoManager.canUndo())
      setCanRedo(undoManager.canRedo())
    }

    sync()
    undoManager.on('stack-item-added', sync)
    undoManager.on('stack-item-popped', sync)
    undoManager.on('stack-cleared', sync)

    return () => {
      undoManager.off('stack-item-added', sync)
      undoManager.off('stack-item-popped', sync)
      undoManager.off('stack-cleared', sync)
    }
  }, [undoManager])

  const undo = useCallback(() => undoManager.undo(), [undoManager])
  const redo = useCallback(() => undoManager.redo(), [undoManager])

  return { undo, redo, canUndo, canRedo }
}
