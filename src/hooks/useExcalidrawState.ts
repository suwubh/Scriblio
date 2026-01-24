// src/hooks/useExcalidrawState.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { ExcalidrawElement, AppState, ToolType } from '../types/excalidraw';
import { useUndoRedo } from './useUndoRedo';

const DEFAULT_APP_STATE: AppState = {
  viewTransform: { x: 0, y: 0, zoom: 1 },
  selectedElementIds: [],
  activeTool: 'selection' as ToolType,
  isToolLocked: false,
  currentItemStrokeColor: '#000000',
  currentItemBackgroundColor: 'transparent',
  currentItemFillStyle: 'hachure',
  currentItemStrokeWidth: 1,
  currentItemStrokeStyle: 'solid',
  currentItemRoughness: 1,
  currentItemOpacity: 100,
  currentItemFontFamily: 'Virgil',
  currentItemFontSize: 20,
  currentItemTextAlign: 'left',
  currentItemStartArrowhead: null,
  currentItemEndArrowhead: 'arrow',
  editingElement: null,
  draggingElement: null,
  resizingElement: null,
  multiElement: null,
  isResizing: false,
  isRotating: false,
  showGrid: false,
  snapToGrid: false,
  zenModeEnabled: false,
  theme: 'light',
  exportBackground: true,
  exportWithDarkMode: false,
  width: window.innerWidth,
  height: window.innerHeight,
};

export function useExcalidrawState() {
  const [elements, setElements] = useState<ExcalidrawElement[]>([]);
  const [appState, setAppState] = useState<AppState>(DEFAULT_APP_STATE);
  
  const { saveState, undo, redo, clear, initialize, canUndo, canRedo } = useUndoRedo();
  
  // References
  const canvasAppRef = useRef<any>(null);
  const undoRedoLock = useRef(false);
  const isInitialized = useRef(false);

  // Initialize history once on mount
  useEffect(() => {
    if (!isInitialized.current) {
      console.log('🎬 Initializing history with elements:', elements.length);
      initialize(elements, appState);
      isInitialized.current = true;
    }
  }, []); // Empty deps - run once on mount

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        performUndo();
      } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault();
        performRedo();
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [canUndo, canRedo]);

  /**
   * Set canvas app reference
   */
  const setCanvasAppRef = useCallback((app: any) => {
    console.log('📌 Canvas app ref set:', !!app);
    canvasAppRef.current = app;
  }, []);

  /**
   * Update app state and sync to canvas
   */
  const updateAppState = useCallback((updates: Partial<AppState>) => {
    setAppState(prev => {
      const next = { ...prev, ...updates };
      
      // Sync to canvas if available and not during undo/redo
      if (canvasAppRef.current && !undoRedoLock.current) {
        canvasAppRef.current.updateAppState(next);
      }
      
      return next;
    });
  }, []);

  /**
   * Handle elements change from canvas
   */
  const setElementsFromCanvas = useCallback((newElements: ExcalidrawElement[]) => {
    console.log('🎨 setElementsFromCanvas called with', newElements.length, 'elements, lock:', undoRedoLock.current);
    
    setElements(newElements);
    
    // Save to history only if not during undo/redo
    if (!undoRedoLock.current) {
      console.log('💾 Saving to history from canvas');
      saveState(newElements, appState);
    } else {
      console.log('🔒 Skipping save - undo/redo in progress');
    }
  }, [saveState, appState]);

  /**
   * Add a new element
   */
  const addElement = useCallback((element: ExcalidrawElement) => {
    if (undoRedoLock.current) return;

    setElements(prev => {
      const next = [...prev, element];
      saveState(next, appState);
      
      if (canvasAppRef.current) {
        canvasAppRef.current.setElements(next);
      }
      
      return next;
    });
  }, [saveState, appState]);

  /**
   * Update an existing element
   */
  const updateElement = useCallback((id: string, updates: Partial<ExcalidrawElement>) => {
    if (undoRedoLock.current) return;

    setElements(prev => {
      const next = prev.map(el => el.id === id ? { ...el, ...updates } : el);
      saveState(next, appState);
      
      if (canvasAppRef.current) {
        canvasAppRef.current.setElements(next);
      }
      
      return next;
    });
  }, [saveState, appState]);

  /**
   * Delete elements by IDs
   */
  const deleteElements = useCallback((ids: string[]) => {
    if (undoRedoLock.current) return;

    setElements(prev => {
      const next = prev.filter(el => !ids.includes(el.id));
      saveState(next, appState);
      
      if (canvasAppRef.current) {
        canvasAppRef.current.setElements(next);
      }
      
      return next;
    });
  }, [saveState, appState]);

  /**
   * Clear entire canvas
   */
  const clearCanvas = useCallback(() => {
    const resetState: AppState = {
      ...DEFAULT_APP_STATE,
      width: appState.width,
      height: appState.height,
    };

    setElements([]);
    setAppState(resetState);
    clear([], resetState);

    if (canvasAppRef.current) {
      canvasAppRef.current.setElements([]);
      canvasAppRef.current.updateAppState(resetState);
    }

    console.log('🗑️ Canvas cleared');
  }, [appState.width, appState.height, clear]);

  /**
   * Perform undo operation
   */
  const performUndo = useCallback(() => {
    if (!canUndo || undoRedoLock.current) return;

    console.log('↶ Performing undo...');
    undoRedoLock.current = true;

    const prevState = undo();

    if (prevState) {
      // Update React state
      setElements(prevState.elements);
      setAppState(prevState.appState);

      // Update canvas after state update
      requestAnimationFrame(() => {
        if (canvasAppRef.current) {
          canvasAppRef.current.setElements(prevState.elements);
          canvasAppRef.current.updateAppState(prevState.appState);
        }

        // Release lock after updates complete
        setTimeout(() => {
          undoRedoLock.current = false;
          console.log('✅ Undo complete');
        }, 50);
      });
    } else {
      undoRedoLock.current = false;
    }
  }, [undo, canUndo]);

  /**
   * Perform redo operation
   */
  const performRedo = useCallback(() => {
    if (!canRedo || undoRedoLock.current) return;

    console.log('↷ Performing redo...');
    undoRedoLock.current = true;

    const nextState = redo();

    if (nextState) {
      // Update React state
      setElements(nextState.elements);
      setAppState(nextState.appState);

      // Update canvas after state update
      requestAnimationFrame(() => {
        if (canvasAppRef.current) {
          canvasAppRef.current.setElements(nextState.elements);
          canvasAppRef.current.updateAppState(nextState.appState);
        }

        // Release lock after updates complete
        setTimeout(() => {
          undoRedoLock.current = false;
          console.log('✅ Redo complete');
        }, 50);
      });
    } else {
      undoRedoLock.current = false;
    }
  }, [redo, canRedo]);

  return {
    // State
    elements,
    appState,
    
    // State updates
    updateAppState,
    setElementsFromCanvas,
    
    // Element operations
    addElement,
    updateElement,
    deleteElements,
    
    // Canvas operations
    clearCanvas,
    setCanvasAppRef,
    
    // Undo/Redo
    undo: performUndo,
    redo: performRedo,
    canUndo,
    canRedo,
    
    // Debug
    _debugHistory: () => {
      console.log('📊 State Debug:', {
        elementsCount: elements.length,
        canUndo,
        canRedo,
        undoRedoLock: undoRedoLock.current,
        hasCanvasRef: !!canvasAppRef.current,
      });
    }
  };
}