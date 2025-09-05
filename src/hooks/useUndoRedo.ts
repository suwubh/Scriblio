// src/hooks/useUndoRedo.ts
import { useState, useCallback } from 'react';
import { ExcalidrawElement, AppState } from '../types/excalidraw';

interface HistoryState {
  elements: ExcalidrawElement[];
  appState: AppState;
}

export function useUndoRedo() {
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [index, setIndex] = useState(-1);

  const saveState = useCallback((elements: ExcalidrawElement[], appState: AppState) => {
    const newState = {
      elements: JSON.parse(JSON.stringify(elements)),
      appState: JSON.parse(JSON.stringify(appState))
    };

    const newHistory = history.slice(0, index + 1);
    newHistory.push(newState);
    
    // Keep only last 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    }

    setHistory(newHistory);
    setIndex(newHistory.length - 1);
  }, [history, index]);

  const undo = useCallback(() => {
    if (index > 0) {
      setIndex(index - 1);
      return history[index - 1];
    }
    return null;
  }, [index, history]);

  const redo = useCallback(() => {
    if (index < history.length - 1) {
      setIndex(index + 1);
      return history[index + 1];
    }
    return null;
  }, [index, history]);

  const clear = useCallback((elements: ExcalidrawElement[], appState: AppState) => {
    const newState = {
      elements: JSON.parse(JSON.stringify(elements)),
      appState: JSON.parse(JSON.stringify(appState))
    };
    setHistory([newState]);
    setIndex(0);
  }, []);

  return {
    saveState,
    undo,
    redo,
    clear,
    canUndo: index > 0,
    canRedo: index < history.length - 1
  };
}
