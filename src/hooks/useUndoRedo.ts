import { useState, useCallback, useRef, useEffect } from 'react';
import { ExcalidrawElement, AppState } from '../types/excalidraw';

interface HistoryEntry {
  elements: ExcalidrawElement[];
  appState: AppState;
}

const MAX_HISTORY = 50;

function cloneEntry(elements: ExcalidrawElement[], appState: AppState): HistoryEntry {
  return {
    elements: JSON.parse(JSON.stringify(elements)),
    appState: JSON.parse(JSON.stringify(appState)),
  };
}

function generateHash(elements: ExcalidrawElement[]): string {
  return elements
    .map(el => `${el.id}:${el.updated}:${el.x}:${el.y}:${el.width}:${el.height}`)
    .join('|');
}

export function useUndoRedo() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const lastHash = useRef<string>('');
  const isInitialized = useRef(false);
  const currentIndexRef = useRef(-1);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const initialize = useCallback((elements: ExcalidrawElement[], appState: AppState) => {
    if (isInitialized.current) return;

    const entry = cloneEntry(elements, appState);
    setHistory([entry]);
    setCurrentIndex(0);
    lastHash.current = generateHash(elements);
    isInitialized.current = true;
  }, []);

  const saveState = useCallback((elements: ExcalidrawElement[], appState: AppState) => {
    const hash = generateHash(elements);
    if (hash === lastHash.current) return;

    const entry = cloneEntry(elements, appState);

    setHistory(prev => {
      const idx = currentIndexRef.current;
      const newHistory = prev.slice(0, idx + 1);
      newHistory.push(entry);

      const newIndex = newHistory.length - 1;
      setCurrentIndex(newIndex);

      if (newHistory.length > MAX_HISTORY) {
        setCurrentIndex(newIndex - 1);
        return newHistory.slice(1);
      }

      return newHistory;
    });

    lastHash.current = hash;
  }, []);

  const undo = useCallback((): HistoryEntry | null => {
    const idx = currentIndexRef.current;
    if (idx <= 0) return null;

    const newIndex = idx - 1;
    const entry = history[newIndex];
    if (!entry) return null;

    setCurrentIndex(newIndex);
    lastHash.current = generateHash(entry.elements);
    return cloneEntry(entry.elements, entry.appState);
  }, [history]);

  const redo = useCallback((): HistoryEntry | null => {
    const idx = currentIndexRef.current;
    if (idx >= history.length - 1) return null;

    const newIndex = idx + 1;
    const entry = history[newIndex];
    if (!entry) return null;

    setCurrentIndex(newIndex);
    lastHash.current = generateHash(entry.elements);
    return cloneEntry(entry.elements, entry.appState);
  }, [history]);

  const clear = useCallback((elements: ExcalidrawElement[], appState: AppState) => {
    const entry = cloneEntry(elements, appState);
    setHistory([entry]);
    setCurrentIndex(0);
    lastHash.current = generateHash(elements);
  }, []);

  const reset = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
    lastHash.current = '';
    isInitialized.current = false;
  }, []);

  return {
    saveState,
    undo,
    redo,
    clear,
    reset,
    initialize,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    historySize: history.length,
    currentIndex,
  };
}
