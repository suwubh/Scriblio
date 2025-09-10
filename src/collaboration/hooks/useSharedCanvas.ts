import { useEffect, useState, useCallback } from 'react'
import { useCollaboration } from './useCollaboration'
import { DrawingStroke, CanvasElement } from '../types/collaboration.types'

export const useSharedCanvas = () => {
  const { documentManager } = useCollaboration()
  const [strokes, setStrokes] = useState<DrawingStroke[]>([])
  const [elements, setElements] = useState<CanvasElement[]>([])

  useEffect(() => {
    // Initial load
    setStrokes(documentManager.getStrokes())
    setElements(documentManager.getElements())

    // Listen for changes
    const unsubscribeStrokes = documentManager.onStrokesChange(() => {
      setStrokes(documentManager.getStrokes())
    })

    const unsubscribeElements = documentManager.onElementsChange(() => {
      setElements(documentManager.getElements())
    })

    return () => {
      unsubscribeStrokes()
      unsubscribeElements()
    }
  }, [documentManager])

  const addStroke = useCallback((stroke: Omit<DrawingStroke, 'id' | 'timestamp'>) => {
    const fullStroke: DrawingStroke = {
      ...stroke,
      id: `stroke-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    }
    documentManager.addStroke(fullStroke)
  }, [documentManager])

  const addElement = useCallback((element: Omit<CanvasElement, 'id' | 'timestamp'>) => {
    const fullElement: CanvasElement = {
      ...element,
      id: `element-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    }
    documentManager.addElement(fullElement)
  }, [documentManager])

  const updateElement = useCallback((elementId: string, updates: Partial<CanvasElement>) => {
    documentManager.updateElement(elementId, updates)
  }, [documentManager])

  const removeElement = useCallback((elementId: string) => {
    documentManager.removeElement(elementId)
  }, [documentManager])

  return {
    strokes,
    elements,
    addStroke,
    addElement,
    updateElement,
    removeElement,
  }
}
