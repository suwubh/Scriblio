// src/hooks/useUndoRedo.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { ExcalidrawElement, AppState } from '../types/excalidraw';

interface HistoryEntry {
  elements: ExcalidrawElement[];
  appState: AppState;
}

const MAX_HISTORY = 50;

/**
 * Creates a deep copy of the history entry
 */
function cloneEntry(elements: ExcalidrawElement[], appState: AppState): HistoryEntry {
  return {
    elements: JSON.parse(JSON.stringify(elements)),
    appState: JSON.parse(JSON.stringify(appState)),
  };
}

/**
 * Generates a hash for quick equality checks
 */
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

  // Keep ref in sync with state
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  /**
   * Initialize history with the first state
   */
  const initialize = useCallback((elements: ExcalidrawElement[], appState: AppState) => {
    if (isInitialized.current) {
      console.log('⏭️ Already initialized, skipping');
      return;
    }

    const entry = cloneEntry(elements, appState);
    const hash = generateHash(elements);

    setHistory([entry]);
    setCurrentIndex(0);
    lastHash.current = hash;
    isInitialized.current = true;

    console.log('📚 History initialized with', elements.length, 'elements');
  }, []);

  /**
   * Save current state to history
   */
  const saveState = useCallback((elements: ExcalidrawElement[], appState: AppState) => {
    const hash = generateHash(elements);

    // Skip if state hasn't changed
    if (hash === lastHash.current) {
      console.log('⏭️ Skipping save - no changes detected');
      return;
    }

    console.log('💾 Saving state to history, elements:', elements.length);

    const entry = cloneEntry(elements, appState);

    setHistory(prev => {
      // Use ref for current index since state might be stale
      const idx = currentIndexRef.current;
      
      // Remove any "future" history after current index
      const newHistory = prev.slice(0, idx + 1);
      
      // Add new entry
      newHistory.push(entry);
      
      const newIndex = newHistory.length - 1;
      
      console.log('📚 History updated - size:', newHistory.length, 'new index:', newIndex);
      
      // Update index
      setCurrentIndex(newIndex);
      
      // Limit history size
      if (newHistory.length > MAX_HISTORY) {
        const trimmed = newHistory.slice(1);
        setCurrentIndex(newIndex - 1);
        return trimmed;
      }
      
      return newHistory;
    });

    lastHash.current = hash;
  }, []);

  /**
   * Undo to previous state
   */
  const undo = useCallback((): HistoryEntry | null => {
    const idx = currentIndexRef.current;
    
    if (idx <= 0) {
      console.log('❌ Cannot undo - at beginning of history');
      return null;
    }

    const newIndex = idx - 1;
    const entry = history[newIndex];

    if (!entry) {
      console.log('❌ No entry at index', newIndex);
      return null;
    }

    setCurrentIndex(newIndex);
    lastHash.current = generateHash(entry.elements);
    
    console.log('↶ Undo to index', newIndex, 'of', history.length);
    
    // Return a deep copy to prevent mutation
    return cloneEntry(entry.elements, entry.appState);
  }, [history]);

  /**
   * Redo to next state
   */
  const redo = useCallback((): HistoryEntry | null => {
    const idx = currentIndexRef.current;
    
    if (idx >= history.length - 1) {
      console.log('❌ Cannot redo - at end of history');
      return null;
    }

    const newIndex = idx + 1;
    const entry = history[newIndex];

    if (!entry) {
      console.log('❌ No entry at index', newIndex);
      return null;
    }

    setCurrentIndex(newIndex);
    lastHash.current = generateHash(entry.elements);
    
    console.log('↷ Redo to index', newIndex, 'of', history.length);
    
    // Return a deep copy to prevent mutation
    return cloneEntry(entry.elements, entry.appState);
  }, [history]);

  /**
   * Clear all history and start fresh
   */
  const clear = useCallback((elements: ExcalidrawElement[], appState: AppState) => {
    const entry = cloneEntry(elements, appState);
    const hash = generateHash(elements);

    setHistory([entry]);
    setCurrentIndex(0);
    lastHash.current = hash;

    console.log('🗑️ History cleared');
  }, []);

  /**
   * Reset the undo/redo system
   */
  const reset = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
    lastHash.current = '';
    isInitialized.current = false;

    console.log('🔄 History reset');
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
    // Debug info
    _debug: () => {
      console.log('📊 History Debug:', {
        historySize: history.length,
        currentIndex,
        currentIndexRef: currentIndexRef.current,
        canUndo: currentIndex > 0,
        canRedo: currentIndex < history.length - 1,
        isInitialized: isInitialized.current,
        lastHash: lastHash.current,
      });
    }
  };
}