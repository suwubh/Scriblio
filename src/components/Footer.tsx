interface FooterProps {
  viewTransform: { x: number; y: number; zoom: number };
  selectedCount: number;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function Footer({ 
  viewTransform, 
  selectedCount, 
  onUndo, 
  onRedo, 
  canUndo, 
  canRedo 
}: FooterProps) {
  return (
    <div className="footer">
      {/* Undo/Redo buttons */}
      <div className="footer-actions">
        <button 
          className={`footer-btn ${!canUndo ? 'disabled' : ''}`}
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          ↶ Undo
        </button>
        <button 
          className={`footer-btn ${!canRedo ? 'disabled' : ''}`}
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          aria-label="Redo"
        >
          ↷ Redo
        </button>
      </div>

      {/* Status info */}
      <span>
        Zoom: {Math.round(viewTransform.zoom * 100)}%
      </span>
      <span>
        Pan: ({Math.round(viewTransform.x)}, {Math.round(viewTransform.y)})
      </span>
      <span>
        Selected: {selectedCount} element{selectedCount !== 1 ? 's' : ''}
      </span>
    </div>
  );
}
