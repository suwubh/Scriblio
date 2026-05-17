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

  const canvasAppRef = useRef<any>(null);
  const undoRedoLock = useRef(false);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current) {
      initialize(elements, appState);
      isInitialized.current = true;
    }
  }, []); // intentionally run once on mount

  const setCanvasAppRef = useCallback((app: any) => {
    canvasAppRef.current = app;
  }, []);

  const updateAppState = useCallback((updates: Partial<AppState>) => {
    setAppState(prev => {
      const next = { ...prev, ...updates };
      if (canvasAppRef.current && !undoRedoLock.current) {
        canvasAppRef.current.updateAppState(next);
      }
      return next;
    });
  }, []);

  const setElementsFromCanvas = useCallback((newElements: ExcalidrawElement[]) => {
    setElements(newElements);
    if (!undoRedoLock.current) {
      saveState(newElements, appState);
    }
  }, [saveState, appState]);

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
  }, [appState.width, appState.height, clear]);

  const performUndo = useCallback(() => {
    if (!canUndo || undoRedoLock.current) return;

    undoRedoLock.current = true;
    const prevState = undo();

    if (prevState) {
      setElements(prevState.elements);
      setAppState(prevState.appState);

      requestAnimationFrame(() => {
        if (canvasAppRef.current) {
          canvasAppRef.current.setElements(prevState.elements);
          canvasAppRef.current.updateAppState(prevState.appState);
        }
        setTimeout(() => { undoRedoLock.current = false; }, 50);
      });
    } else {
      undoRedoLock.current = false;
    }
  }, [undo, canUndo]);

  const performRedo = useCallback(() => {
    if (!canRedo || undoRedoLock.current) return;

    undoRedoLock.current = true;
    const nextState = redo();

    if (nextState) {
      setElements(nextState.elements);
      setAppState(nextState.appState);

      requestAnimationFrame(() => {
        if (canvasAppRef.current) {
          canvasAppRef.current.setElements(nextState.elements);
          canvasAppRef.current.updateAppState(nextState.appState);
        }
        setTimeout(() => { undoRedoLock.current = false; }, 50);
      });
    } else {
      undoRedoLock.current = false;
    }
  }, [redo, canRedo]);

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
  }, [performUndo, performRedo]);

  return {
    elements,
    appState,
    updateAppState,
    setElementsFromCanvas,
    addElement,
    updateElement,
    deleteElements,
    clearCanvas,
    setCanvasAppRef,
    undo: performUndo,
    redo: performRedo,
    canUndo,
    canRedo,
  };
}
