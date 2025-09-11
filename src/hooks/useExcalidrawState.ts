// src/hooks/useExcalidrawState.ts
import { useState, useCallback, useRef, useEffect } from 'react';
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
    height: window.innerHeight,
  });

  const { saveState, undo, redo, clear, initialize, canUndo, canRedo } = useUndoRedo();
  const canvasAppRef = useRef<any>(null);
  const isUndoRedoInProgress = useRef(false);
  const isInitialized = useRef(false);
  const lastCommittedSignature = useRef<string>('');

  // Initialize history once
  useEffect(() => {
    if (!isInitialized.current) {
      initialize(elements, appState);
      isInitialized.current = true;
    }
  }, [initialize, elements, appState]);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey)) {
        if (event.key === 'z' && !event.shiftKey) {
          event.preventDefault();
          performUndo();
        } else if (event.key === 'y' || (event.key === 'z' && event.shiftKey)) {
          event.preventDefault();
          performRedo();
        }
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, []);

  const generateSignature = useCallback((els: ExcalidrawElement[]) => {
  return els
    .map(el =>
      [
        el.id,
        el.x, el.y, el.width, el.height, el.angle,
        el.strokeColor, el.backgroundColor,
        el.strokeWidth, el.strokeStyle, el.roughness, el.fillStyle,
        el.opacity,
        el.points?.length || 0,
        el.text || '',
        el.imageData ? 1 : 0,
      ].join(':'),
    )
    .join('|');
}, []);

  const commitScene = useCallback(
    (nextElements: ExcalidrawElement[], nextAppState: AppState) => {
      if (isUndoRedoInProgress.current) return;

      const signature = generateSignature(nextElements);
      if (signature !== lastCommittedSignature.current) {
        saveState(nextElements, nextAppState);
        lastCommittedSignature.current = signature;
      }
    },
    [saveState, generateSignature]
  );

  const setCanvasAppRef = useCallback((app: any) => {
  console.log('📌 Setting canvas app ref:', !!app)
  canvasAppRef.current = app
}, []);

  const updateAppState = useCallback(
  (updates: Partial<AppState>) => {
    console.log('🔄 updateAppState called with:', Object.keys(updates))
    console.log('📱 canvasAppRef.current:', !!canvasAppRef.current)
    
    setAppState(prev => {
      const merged = { ...prev, ...updates }
      
      // ✅ Add proper null check and method verification
      if (canvasAppRef.current && 
          typeof canvasAppRef.current.updateAppState === 'function' && 
          !isUndoRedoInProgress.current) {
        console.log('✅ Calling canvasAppRef.current.updateAppState')
        canvasAppRef.current.updateAppState(merged)
      } else {
        console.log('⏳ Skipping canvas update - not ready yet')
      }

      return merged
    })
  },
  []
);

  const setElementsFromCanvas = useCallback(
    (newElements: ExcalidrawElement[]) => {
      if (isUndoRedoInProgress.current) {
        setElements(newElements);
        return;
      }

      setElements(newElements);
      commitScene(newElements, appState);
    },
    [commitScene, appState]
  );

  const addElement = useCallback(
    (element: ExcalidrawElement) => {
      if (isUndoRedoInProgress.current) return;

      setElements(prev => {
        const next = [...prev, element];
        commitScene(next, appState);
        return next;
      });
    },
    [commitScene, appState]
  );

  const updateElement = useCallback(
    (id: string, updates: Partial<ExcalidrawElement>) => {
      if (isUndoRedoInProgress.current) return;

      setElements(prev => {
        const next = prev.map(el => (el.id === id ? { ...el, ...updates } : el));
        commitScene(next, appState);
        return next;
      });
    },
    [commitScene, appState]
  );

  const deleteElements = useCallback(
    (ids: string[]) => {
      if (isUndoRedoInProgress.current) return;

      setElements(prev => {
        const next = prev.filter(el => !ids.includes(el.id));
        commitScene(next, appState);
        return next;
      });
    },
    [commitScene, appState]
  );

  const clearCanvas = useCallback(() => {
    const resetAppState: AppState = {
      ...appState,
      selectedElementIds: [],
      viewTransform: { x: 0, y: 0, zoom: 1 },
      editingElement: null,
      draggingElement: null,
      resizingElement: null,
    };

    setElements([]);
    setAppState(resetAppState);
    clear([], resetAppState);

    if (canvasAppRef.current) {
      canvasAppRef.current.setElements([]);
      canvasAppRef.current.updateAppState(resetAppState);
    }

    lastCommittedSignature.current = '';
  }, [appState, clear]);

  const performUndo = useCallback(() => {
    if (!canUndo) return;

    isUndoRedoInProgress.current = true;
    const prevState = undo();
    
    if (prevState) {
      setElements(prevState.elements);
      setAppState(prevState.appState);

      if (canvasAppRef.current) {
        canvasAppRef.current.setElements(prevState.elements);
        canvasAppRef.current.updateAppState(prevState.appState);
      }

      lastCommittedSignature.current = generateSignature(prevState.elements);
    }

    // Release the lock after a brief delay to ensure all updates are complete
    setTimeout(() => {
      isUndoRedoInProgress.current = false;
    }, 10);
  }, [undo, canUndo, generateSignature]);

  const performRedo = useCallback(() => {
    if (!canRedo) return;

    isUndoRedoInProgress.current = true;
    const nextState = redo();
    
    if (nextState) {
      setElements(nextState.elements);
      setAppState(nextState.appState);

      if (canvasAppRef.current) {
        canvasAppRef.current.setElements(nextState.elements);
        canvasAppRef.current.updateAppState(nextState.appState);
      }

      lastCommittedSignature.current = generateSignature(nextState.elements);
    }

    setTimeout(() => {
      isUndoRedoInProgress.current = false;
    }, 10);
  }, [redo, canRedo, generateSignature]);

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
    setCanvasAppRef,
    setElementsFromCanvas,
  };
}
