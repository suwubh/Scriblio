import { useState, useCallback, useRef } from 'react';
import { ScriblioElement, AppState, ToolType } from '../types/scriblio';
import { CanvasApp } from '../components/Canvas';

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

/**
 * Holds the canvas element list and app state for the React tree.
 *
 * Undo/redo is NOT handled here — it lives in the shared Yjs document
 * (`useYjsHistory`), so it stays correct across collaborators.
 */
export function useScriblioState() {
  const [elements, setElements] = useState<ScriblioElement[]>([]);
  const [appState, setAppState] = useState<AppState>(DEFAULT_APP_STATE);

  const canvasAppRef = useRef<CanvasApp | null>(null);

  const setCanvasAppRef = useCallback((app: CanvasApp) => {
    canvasAppRef.current = app;
  }, []);

  const updateAppState = useCallback((updates: Partial<AppState>) => {
    setAppState(prev => {
      const next = { ...prev, ...updates };
      canvasAppRef.current?.updateAppState(next);
      return next;
    });
  }, []);

  const setElementsFromCanvas = useCallback((newElements: ScriblioElement[]) => {
    setElements(newElements);
  }, []);

  // Applies elements received from a remote collaborator (or an undo/redo
  // replayed through the shared document). Updates React state and the canvas
  // without re-broadcasting.
  const applyRemoteElements = useCallback((remoteElements: ScriblioElement[]) => {
    setElements(remoteElements);
    canvasAppRef.current?.setElements(remoteElements);
  }, []);

  const addElement = useCallback((element: ScriblioElement) => {
    setElements(prev => {
      const next = [...prev, element];
      canvasAppRef.current?.setElements(next);
      return next;
    });
  }, []);

  const updateElement = useCallback((id: string, updates: Partial<ScriblioElement>) => {
    setElements(prev => {
      const next = prev.map(el => el.id === id ? { ...el, ...updates } : el);
      canvasAppRef.current?.setElements(next);
      return next;
    });
  }, []);

  const deleteElements = useCallback((ids: string[]) => {
    setElements(prev => {
      const next = prev.filter(el => !ids.includes(el.id));
      canvasAppRef.current?.setElements(next);
      return next;
    });
  }, []);

  const clearCanvas = useCallback(() => {
    setElements([]);
    setAppState(prev => {
      const resetState: AppState = {
        ...DEFAULT_APP_STATE,
        width: prev.width,
        height: prev.height,
      };
      canvasAppRef.current?.updateAppState(resetState);
      return resetState;
    });
    canvasAppRef.current?.setElements([]);
  }, []);

  return {
    elements,
    appState,
    updateAppState,
    setElementsFromCanvas,
    applyRemoteElements,
    addElement,
    updateElement,
    deleteElements,
    clearCanvas,
    setCanvasAppRef,
  };
}
