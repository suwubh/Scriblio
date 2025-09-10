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
  // Create a more efficient signature for state comparison
  const elementsSignature = elements.map(el => `${el.id}:${el.x}:${el.y}:${el.width}:${el.height}:${el.updated}`).join(',');
  const appStateSignature = `${appState.viewTransform.x}:${appState.viewTransform.y}:${appState.viewTransform.zoom}:${appState.selectedElementIds.join(',')}`;
  return `${elementsSignature}|${appStateSignature}`;
}

export function useUndoRedo() {
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [index, setIndex] = useState(-1);
  const [lastSignature, setLastSignature] = useState<string>('');

  const initialize = useCallback((elements: ExcalidrawElement[], appState: AppState) => {
    if (history.length === 0) {
      const initial = deepCopyState(elements, appState);
      const signature = generateStateSignature(elements, appState);
      setHistory([initial]);
      setIndex(0);
      setLastSignature(signature);
    }
  }, [history.length]);

  const saveState = useCallback((elements: ExcalidrawElement[], appState: AppState) => {
    const signature = generateStateSignature(elements, appState);
    
    // Don't save if the state hasn't actually changed
    if (signature === lastSignature) {
      return;
    }

    const nextState = deepCopyState(elements, appState);
    
    setHistory(prev => {
      // Remove all states after current index (handles branching from undo state)
      const base = prev.slice(0, Math.max(0, index + 1));
      const next = [...base, nextState];
      
      // Limit history size to prevent memory issues
      if (next.length > 50) {
        next.shift();
        return next;
      }
      return next;
    });
    
    setIndex(prev => Math.min(prev + 1, 49));
    setLastSignature(signature);
  }, [index, lastSignature]);

  const undo = useCallback((): HistoryState | null => {
    if (index <= 0 || history.length === 0) return null;
    
    const newIndex = index - 1;
    setIndex(newIndex);
    const state = history[newIndex];
    
    if (state) {
      const signature = generateStateSignature(state.elements, state.appState);
      setLastSignature(signature);
      return deepCopyState(state.elements, state.appState);
    }
    
    return null;
  }, [history, index]);

  const redo = useCallback((): HistoryState | null => {
    if (index >= history.length - 1) return null;
    
    const newIndex = index + 1;
    setIndex(newIndex);
    const state = history[newIndex];
    
    if (state) {
      const signature = generateStateSignature(state.elements, state.appState);
      setLastSignature(signature);
      return deepCopyState(state.elements, state.appState);
    }
    
    return null;
  }, [history, index]);

  const clear = useCallback((elements: ExcalidrawElement[], appState: AppState) => {
    const cleared = deepCopyState(elements, appState);
    const signature = generateStateSignature(elements, appState);
    
    setHistory(prev => {
      const base = prev.slice(0, Math.max(0, index + 1));
      const next = [...base, cleared];
      if (next.length > 50) next.shift();
      return next;
    });
    
    setIndex(prev => Math.min(prev + 1, 49));
    setLastSignature(signature);
  }, [index]);

  return {
    saveState,
    undo,
    redo,
    clear,
    initialize,
    canUndo: index > 0,
    canRedo: index < history.length - 1,
  };
}
