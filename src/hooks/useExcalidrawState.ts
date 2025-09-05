// src/hooks/useExcalidrawState.ts
import { useState, useCallback, useRef } from 'react';
import { ExcalidrawElement, AppState, ToolType } from '../types/excalidraw';
import { useUndoRedo } from './useUndoRedo';

export function useExcalidrawState() {
  const [elements, setElements] = useState<ExcalidrawElement[]>([]);
  const [appState, setAppState] = useState<AppState>({
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
    height: window.innerHeight
  });

  const { saveState, undo, redo, clear, canUndo, canRedo } = useUndoRedo();
  const canvasAppRef = useRef<any>(null);

  // Debounced save to history
  const saveTimeoutRef = useRef<number | null>(null);
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveState(elements, appState);
    }, 300);
  }, [elements, appState, saveState]);

  const setCanvasAppRef = useCallback((app: any) => {
    canvasAppRef.current = app;
  }, []);

  const updateAppState = useCallback((updates: Partial<AppState>) => {
    setAppState(prev => {
      const newState = { ...prev, ...updates };
      setTimeout(() => debouncedSave(), 0);
      return newState;
    });
  }, [debouncedSave]);

  const addElement = useCallback((element: ExcalidrawElement) => {
    setElements(prev => {
      const newElements = [...prev, element];
      setTimeout(() => debouncedSave(), 0);
      return newElements;
    });
  }, [debouncedSave]);

  const updateElement = useCallback((id: string, updates: Partial<ExcalidrawElement>) => {
    setElements(prev => {
      const newElements = prev.map(el => el.id === id ? { ...el, ...updates } : el);
      setTimeout(() => debouncedSave(), 0);
      return newElements;
    });
  }, [debouncedSave]);

  const deleteElements = useCallback((ids: string[]) => {
    setElements(prev => {
      const newElements = prev.filter(el => !ids.includes(el.id));
      setTimeout(() => debouncedSave(), 0);
      return newElements;
    });
  }, [debouncedSave]);

  const clearCanvas = useCallback(() => {
    const resetAppState = {
      ...appState,
      selectedElementIds: [],
      viewTransform: { x: 0, y: 0, zoom: 1 }
    };

    setElements([]);
    setAppState(resetAppState);
    clear([], resetAppState);

    // Clear canvas engine
    if (canvasAppRef.current) {
      canvasAppRef.current.clearElements();
      canvasAppRef.current.updateAppState(resetAppState);
    }
  }, [appState, clear]);

  const performUndo = useCallback(() => {
    const prevState = undo();
    if (prevState) {
      setElements(prevState.elements);
      setAppState(prevState.appState);

      // Update canvas engine immediately
      if (canvasAppRef.current) {
        canvasAppRef.current.setElements(prevState.elements);
        canvasAppRef.current.updateAppState(prevState.appState);
      }
    }
  }, [undo]);

  const performRedo = useCallback(() => {
    const nextState = redo();
    if (nextState) {
      setElements(nextState.elements);
      setAppState(nextState.appState);

      // Update canvas engine immediately
      if (canvasAppRef.current) {
        canvasAppRef.current.setElements(nextState.elements);
        canvasAppRef.current.updateAppState(nextState.appState);
      }
    }
  }, [redo]);

  return {
    elements,
    appState,
    updateAppState,
    addElement,
    updateElement,
    deleteElements,
    clearCanvas,
    undo: performUndo,
    redo: performRedo,
    canUndo,
    canRedo,
    setCanvasAppRef
  };
}
