// src/hooks/useExcalidrawState.ts
import { useState, useCallback } from 'react';
import { ExcalidrawElement, AppState, ToolType } from '../types/excalidraw';

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

  const updateAppState = useCallback((updates: Partial<AppState>) => {
    setAppState((prev) => ({ ...prev, ...updates }));
  }, []);

  const addElement = useCallback((element: ExcalidrawElement) => {
    setElements(prev => [...prev, element]);
  }, []);

  const updateElement = useCallback((id: string, updates: Partial<ExcalidrawElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  }, []);

  const deleteElements = useCallback((ids: string[]) => {
    setElements(prev => prev.filter(el => !ids.includes(el.id)));
  }, []);

  const clearCanvas = useCallback(() => {
    setElements([]);
    updateAppState({ selectedElementIds: [] });
  }, [updateAppState]);

  return {
    elements,
    appState,
    updateAppState,
    addElement,
    updateElement,
    deleteElements,
    clearCanvas
  };
}
