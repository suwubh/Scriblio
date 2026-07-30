import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AIModal } from './AIModal';
import { ScriblioElement } from '../types/scriblio';

interface AICommandPaletteProps {
  elements: ScriblioElement[];
  selectedElements: ScriblioElement[];
  onAddElements: (elements: Partial<ScriblioElement>[]) => void;
}

const SparklesGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 3c.7 5 2.9 7.2 8 8-5.1.8-7.3 3-8 8-.7-5-2.9-7.2-8-8 5.1-.8 7.3-3 8-8Z"
      fill="currentColor"
    />
    <path
      d="M19 3c.2 1.7.9 2.5 2.6 2.8-1.7.3-2.4 1.1-2.6 2.8-.2-1.7-.9-2.5-2.6-2.8C17.1 5.5 17.8 4.7 19 3Z"
      fill="currentColor"
      opacity=".55"
    />
  </svg>
);

export const AICommandPalette: React.FC<AICommandPaletteProps> = ({
  elements,
  selectedElements,
  onAddElements,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const preventNextOpen = useRef(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      e.stopPropagation();

      if (preventNextOpen.current) {
        preventNextOpen.current = false;
        return;
      }

      setIsOpen(prev => !prev);
      preventNextOpen.current = true;
      setTimeout(() => { preventNextOpen.current = false; }, 100);
    }
  }, []);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      setIsOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('keydown', handleEscape);
    };
  }, [handleKeyDown, handleEscape]);

  return (
    <>
      <button
        className="ai-floating-btn"
        onClick={() => setIsOpen(true)}
        title="AI Assistant (⌘K / Ctrl+K)"
        aria-label="Open AI Assistant"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className="ai-floating-icon" aria-hidden="true">
          <SparklesGlyph />
        </span>
        <span className="ai-floating-text">AI Assistant</span>
        <kbd className="ai-floating-shortcut">
          {/Mac|iPhone|iPad/i.test(navigator.userAgent) ? '⌘K' : 'Ctrl K'}
        </kbd>
      </button>

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