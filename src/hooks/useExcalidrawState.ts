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
  console.log('🔄 UNDO clicked - canUndo:', canUndo, 'isInProgress:', isUndoRedoInProgress.current);
  
  if (!canUndo) {
    console.log('❌ Cannot undo - no history available');
    return;
  }

  if (isUndoRedoInProgress.current) {
    console.log('⚠️ Undo already in progress, skipping');
    return;
  }

  isUndoRedoInProgress.current = true;
  console.log('🔒 Undo lock acquired');
  
  const prevState = undo();
  
  if (prevState) {
    console.log('📚 Undo successful, restoring state with', prevState.elements.length, 'elements');
    
    // Update React state first
    setElements(prevState.elements);
    setAppState(prevState.appState);

    // Use requestAnimationFrame for better timing with canvas updates
    requestAnimationFrame(() => {
      if (canvasAppRef.current) {
        console.log('🎨 Updating canvas with undo state');
        try {
          canvasAppRef.current.setElements(prevState.elements);
          canvasAppRef.current.updateAppState(prevState.appState);
          console.log('✅ Canvas updated successfully');
        } catch (error) {
          console.error('❌ Failed to update canvas during undo:', error);
        }
      } else {
        console.log('⚠️ Canvas ref not available during undo');
      }
      
      // Update signature after canvas update
      lastCommittedSignature.current = generateSignature(prevState.elements);
      
      // Release lock with longer timeout to ensure all updates complete
      setTimeout(() => {
        isUndoRedoInProgress.current = false;
        console.log('🔓 Undo lock released');
      }, 50);
    });
  } else {
    console.log('❌ Undo returned null state');
    isUndoRedoInProgress.current = false;
  }
}, [undo, canUndo, generateSignature]);

const performRedo = useCallback(() => {
  console.log('🔄 REDO clicked - canRedo:', canRedo, 'isInProgress:', isUndoRedoInProgress.current);
  
  if (!canRedo) {
    console.log('❌ Cannot redo - no future history available');
    return;
  }

  if (isUndoRedoInProgress.current) {
    console.log('⚠️ Redo already in progress, skipping');
    return;
  }

  isUndoRedoInProgress.current = true;
  console.log('🔒 Redo lock acquired');
  
  const nextState = redo();
  
  if (nextState) {
    console.log('📚 Redo successful, restoring state with', nextState.elements.length, 'elements');
    
    // Update React state first
    setElements(nextState.elements);
    setAppState(nextState.appState);

    // Use requestAnimationFrame for better timing with canvas updates
    requestAnimationFrame(() => {
      if (canvasAppRef.current) {
        console.log('🎨 Updating canvas with redo state');
        try {
          canvasAppRef.current.setElements(nextState.elements);
          canvasAppRef.current.updateAppState(nextState.appState);
          console.log('✅ Canvas updated successfully');
        } catch (error) {
          console.error('❌ Failed to update canvas during redo:', error);
        }
      } else {
        console.log('⚠️ Canvas ref not available during redo');
      }
      
      // Update signature after canvas update
      lastCommittedSignature.current = generateSignature(nextState.elements);
      
      // Release lock with longer timeout to ensure all updates complete
      setTimeout(() => {
        isUndoRedoInProgress.current = false;
        console.log('🔓 Redo lock released');
      }, 50);
    });
  } else {
    console.log('❌ Redo returned null state');
    isUndoRedoInProgress.current = false;
  }
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
