// src/components/AICommandPalette.tsx
import React, { useState, useEffect, useCallback } from 'react';
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

  // Keyboard shortcut handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Cmd/Ctrl + K to open AI assistant
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsOpen(prev => !prev);
    }

    // Escape to close
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <>
      {/* Floating AI Button */}
      <button
        className="ai-floating-btn"
        onClick={() => setIsOpen(true)}
        title="AI Assistant (Cmd/Ctrl + K)"
        aria-label="Open AI Assistant"
      >
        <span className="ai-floating-icon">✨</span>
        <span className="ai-floating-text">AI Assistant</span>
        <span className="ai-floating-shortcut">⌘K</span>
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