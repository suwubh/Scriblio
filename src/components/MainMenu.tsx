// src/components/MainMenu.tsx
import { useState, useRef, useEffect } from 'react';

interface MainMenuProps {
  onClear: () => void;
  onExport: () => void;
  onImport: () => void;
}

export function MainMenu({ onClear, onExport, onImport }: MainMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the canvas? This action cannot be undone.')) {
      onClear();
    }
    setIsMenuOpen(false);
  };

  const handleExport = () => {
    try {
      onExport();
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleImport = () => {
    try {
      onImport();
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please check your file and try again.');
    }
  };

  return (
    <div className="mainmenu" ref={menuRef}>
      <button 
        className={`menu-trigger ${isMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-expanded={isMenuOpen}
        aria-haspopup="true"
        aria-label="Main menu"
      >
        ☰ Menu
      </button>
      
      {isMenuOpen && (
        <div className="menu-popover">
          <button 
            onClick={handleClear}
            aria-label="Clear canvas"
          >
            🗑️ Clear canvas
          </button>
          
          <button 
            onClick={handleExport}
            aria-label="Export drawing"
          >
            💾 Export to JSON
          </button>
          
          <button 
            onClick={handleImport}
            aria-label="Import drawing"
          >
            📁 Import from JSON
          </button>
          
          <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid var(--border)' }} />
          
        </div>
      )}
    </div>
  );
}
