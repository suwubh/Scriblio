// src/hooks/useUndoRedo.ts
import { useState, useCallback } from 'react';
import { ExcalidrawElement, AppState } from '../types/excalidraw';

interface HistoryState {
  elements: ExcalidrawElement[];
  appState: AppState;
}

function deepCopyState(elements: ExcalidrawElement[], appState: AppState): HistoryState {
  return {
    elements: JSON.parse(JSON.stringify(elements)),
    appState: JSON.parse(JSON.stringify(appState)),
  };
}

function generateStateSignature(elements: ExcalidrawElement[], appState: AppState): string {
  // Create a more comprehensive signature for state comparison
  const elementsSignature = elements.map(el =>
    [
      el.id, el.type, el.x, el.y, el.width, el.height, el.angle,
      el.strokeColor, el.backgroundColor, el.strokeWidth, el.strokeStyle,
      el.roughness, el.fillStyle, el.opacity,
      el.points ? el.points.length : 0,
      el.text ? el.text.length : 0,
      el.imageData ? 1 : 0,
      el.updated || 0,
    ].join(':')
  ).join('|');

  // Include more of appState that affects view/selection
  const appStateSignature = [
    appState.viewTransform.x,
    appState.viewTransform.y,
    appState.viewTransform.zoom,
    appState.selectedElementIds.join(','),
    appState.activeTool,
    appState.isToolLocked ? 1 : 0,
  ].join(':');

  return `${elementsSignature}|${appStateSignature}`;
}

export function useUndoRedo() {
  const [state, setState] = useState({
    history: [] as HistoryState[],
    index: -1,
    lastSignature: ''
  });

  const initialize = useCallback((elements: ExcalidrawElement[], appState: AppState) => {
    console.log('🎯 Initialize called');
    
    setState(prev => {
      if (prev.history.length === 0) {
        const initial = deepCopyState(elements, appState);
        const signature = generateStateSignature(elements, appState);
        
        console.log('✅ Initializing history');
        
        return {
          history: [initial],
          index: 0,
          lastSignature: signature
        };
      }
      return prev;
    });
  }, []);

  const saveState = useCallback((elements: ExcalidrawElement[], appState: AppState) => {
    const signature = generateStateSignature(elements, appState);
    
    setState(prev => {
      console.log('💾 saveState:', {
        elementsCount: elements.length,
        currentIndex: prev.index,
        historyLength: prev.history.length,
        willSave: signature !== prev.lastSignature
      });
      
      if (signature === prev.lastSignature) {
        console.log('⏭️ Skipping save - unchanged');
        return prev;
      }

      const nextState = deepCopyState(elements, appState);
      const base = prev.history.slice(0, prev.index + 1);
      const newHistory = [...base, nextState];
      
      console.log('📚 History updated:', {
        newLength: newHistory.length,
        newIndex: prev.index + 1
      });
      
      return {
        history: newHistory.length > 50 ? newHistory.slice(1) : newHistory,
        index: Math.min(prev.index + 1, 49),
        lastSignature: signature
      };
    });
  }, []);

  const undo = useCallback((): HistoryState | null => {
    let result: HistoryState | null = null;
    
    setState(prev => {
      console.log('🔙 Undo:', { index: prev.index, historyLength: prev.history.length });
      
      if (prev.index <= 0 || prev.history.length === 0) {
        console.log('❌ Cannot undo');
        return prev;
      }
      
      const newIndex = prev.index - 1;
      const state = prev.history[newIndex];
      
      if (state) {
        console.log('✅ Undo successful:', { newIndex, elementsCount: state.elements.length });
        result = deepCopyState(state.elements, state.appState);
        
        return {
          ...prev,
          index: newIndex,
          lastSignature: generateStateSignature(state.elements, state.appState)
        };
      }
      
      console.log('❌ No state at index:', newIndex);
      return prev;
    });
    
    return result;
  }, []);

  const redo = useCallback((): HistoryState | null => {
    let result: HistoryState | null = null;
    
    setState(prev => {
      console.log('🔜 Redo:', { index: prev.index, historyLength: prev.history.length });
      
      if (prev.index >= prev.history.length - 1) {
        console.log('❌ Cannot redo');
        return prev;
      }
      
      const newIndex = prev.index + 1;
      const state = prev.history[newIndex];
      
      if (state) {
        console.log('✅ Redo successful:', { newIndex, elementsCount: state.elements.length });
        result = deepCopyState(state.elements, state.appState);
        
        return {
          ...prev,
          index: newIndex,
          lastSignature: generateStateSignature(state.elements, state.appState)
        };
      }
      
      return prev;
    });
    
    return result;
  }, []);

  const clear = useCallback((elements: ExcalidrawElement[], appState: AppState) => {
    setState(prev => {
      const cleared = deepCopyState(elements, appState);
      const base = prev.history.slice(0, prev.index + 1);
      const newHistory = [...base, cleared];
      
      return {
        history: newHistory.length > 50 ? newHistory.slice(1) : newHistory,
        index: Math.min(prev.index + 1, 49),
        lastSignature: generateStateSignature(elements, appState)
      };
    });
  }, []);

  return {
    saveState,
    undo,
    redo,
    clear,
    initialize,
    canUndo: state.index > 0,
    canRedo: state.index < state.history.length - 1,
  };
}
