// src/components/AICommandPalette.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AIModal } from './AIModal';
import { ExcalidrawElement } from '../types/excalidraw';

interface AICommandPaletteProps {
  elements: ExcalidrawElement[];
  selectedElements: ExcalidrawElement[];
  onAddElements: (elements: Partial<ExcalidrawElement>[]) => void;
}

export const AICommandPalette: React.FC<AICommandPaletteProps> = ({
  elements,
  selectedElements,
  onAddElements,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const preventNextOpen = useRef(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Prevent conflicts with browser shortcuts
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      e.stopPropagation();
      
      // Prevent double-trigger on some systems
      if (preventNextOpen.current) {
        preventNextOpen.current = false;
        return;
      }
      
      setIsOpen(prev => !prev);
      preventNextOpen.current = true;
      setTimeout(() => {
        preventNextOpen.current = false;
      }, 100);
    }
  }, []);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      setIsOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    // Use capture phase to handle before other listeners
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('keydown', handleEscape);
    };
  }, [handleKeyDown, handleEscape]);

  return (
    <>
      {/* Floating AI Button */}
      <button
        className="ai-floating-btn"
        onClick={() => setIsOpen(true)}
        title="AI Assistant (⌘K / Ctrl+K)"
        aria-label="Open AI Assistant"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className="ai-floating-icon" aria-hidden="true">✨</span>
        <span className="ai-floating-text">AI Assistant</span>
        <kbd className="ai-floating-shortcut">
          {navigator.platform.includes('Mac') ? '⌘K' : 'Ctrl+K'}
        </kbd>
      </button>

      {/* AI Modal */}
      <AIModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        elements={elements}
        selectedElements={selectedElements}
        onAddElements={onAddElements}
      />
    </>
  );
};