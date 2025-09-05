// src/components/PropertiesPanel.tsx
import { ExcalidrawElement, AppState } from '../types/excalidraw';

interface PropertiesPanelProps {
  selectedElements: ExcalidrawElement[];
  appState: AppState;
  onPropertyChange: (updates: Partial<AppState>) => void;
  isOpen: boolean;
  onClose: () => void;
  onClear: () => void;
  onExport: () => void;
  onImport: () => void;
}

export function PropertiesPanel({ 
  appState, 
  onPropertyChange, 
  isOpen, 
  onClose,
  onClear,
  onExport,
  onImport 
}: PropertiesPanelProps) {
  const strokeColors = [
    '#000000', '#e03131', '#2f9e44', '#1971c2',
    '#f08c00', '#7048e8', '#d6336c', 'transparent'
  ];

  const backgroundColors = [
    'transparent', '#ffffff', '#f8f9fa', '#ffec99',
    '#d0ebff', '#c5f6d0', '#ffd3e1', '#e5dbff'
  ];

  const strokeWidths = [1, 2, 4, 8];
  const fillStyles = ['hachure', 'cross-hatch', 'solid'] as const;

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the canvas? This action cannot be undone.')) {
      onClear();
    }
    onClose();
  };

  const handleExport = () => {
    try {
      onExport();
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleImport = () => {
    try {
      onImport();
      onClose();
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please check your file and try again.');
    }
  };

  return (
    <div className={`sidepanel ${isOpen ? 'open' : ''}`}>
      {/* Close Button */}
      <div className="panel-header">
        <h3>Properties</h3>
        <button className="close-btn" onClick={onClose} aria-label="Close panel">
          ✕
        </button>
      </div>

      <div className="panel">
        {/* Stroke Color */}
        <div className="panel-section">
          <h4 className="panel-label">Stroke</h4>
          <div className="swatches">
            {strokeColors.map((color) => (
              <button
                key={color}
                className={`swatch ${appState.currentItemStrokeColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => onPropertyChange({ currentItemStrokeColor: color })}
                title={color}
                aria-label={`Stroke color: ${color}`}
              >
                {color === 'transparent' && (
                  <div style={{ 
                    background: 'linear-gradient(45deg, #f00 25%, transparent 25%, transparent 75%, #f00 75%)', 
                    backgroundSize: '8px 8px',
                    width: '100%',
                    height: '100%'
                  }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Background Color */}
        <div className="panel-section">
          <h4 className="panel-label">Background</h4>
          <div className="swatches">
            {backgroundColors.map((color) => (
              <button
                key={color}
                className={`swatch ${appState.currentItemBackgroundColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => onPropertyChange({ currentItemBackgroundColor: color })}
                title={color}
                aria-label={`Background color: ${color}`}
              >
                {color === 'transparent' && (
                  <div style={{ 
                    background: 'linear-gradient(45deg, #f00 25%, transparent 25%, transparent 75%, #f00 75%)', 
                    backgroundSize: '8px 8px',
                    width: '100%',
                    height: '100%'
                  }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Fill Style */}
        <div className="panel-section">
          <h4 className="panel-label">Fill</h4>
          <div className="buttons">
            {fillStyles.map((style) => (
              <button
                key={style}
                className={`chip ${appState.currentItemFillStyle === style ? 'selected' : ''}`}
                onClick={() => onPropertyChange({ currentItemFillStyle: style })}
                title={style}
                aria-label={`Fill style: ${style}`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Stroke Width */}
        <div className="panel-section">
          <h4 className="panel-label">Stroke width</h4>
          <div className="buttons">
            {strokeWidths.map((width) => (
              <button
                key={width}
                className={`chip ${appState.currentItemStrokeWidth === width ? 'selected' : ''}`}
                onClick={() => onPropertyChange({ currentItemStrokeWidth: width })}
                title={`${width}px`}
                aria-label={`Stroke width: ${width}px`}
              >
                {width}
              </button>
            ))}
          </div>
        </div>

        {/* Sloppiness Slider */}
        <div className="panel-section">
          <h4 className="panel-label">Sloppiness</h4>
          <input
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={appState.currentItemRoughness}
            onChange={(e) => onPropertyChange({ currentItemRoughness: Number(e.target.value) })}
            className="excalidraw-slider"
          />
          <div className="slider-labels">
            <span>Architect</span>
            <span>Artist</span>
            <span>Cartoonist</span>
          </div>
        </div>

        {/* Opacity Slider */}
        <div className="panel-section">
          <h4 className="panel-label">Opacity — {appState.currentItemOpacity}%</h4>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={appState.currentItemOpacity}
            onChange={(e) => onPropertyChange({ currentItemOpacity: Number(e.target.value) })}
            className="excalidraw-slider"
          />
        </div>
      </div>

      {/* Menu Actions at Bottom */}
      <div className="panel-actions">
        <button className="action-btn clear-btn" onClick={handleClear}>
          🗑️ Clear Canvas
        </button>
        <button className="action-btn export-btn" onClick={handleExport}>
          💾 Export JSON
        </button>
        <button className="action-btn import-btn" onClick={handleImport}>
          📁 Import JSON
        </button>
      </div>
    </div>
  );
}
