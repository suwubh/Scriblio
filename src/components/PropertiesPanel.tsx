// src/components/PropertiesPanel.tsx
import { ExcalidrawElement, AppState } from '../types/excalidraw';

interface PropertiesPanelProps {
  selectedElements: ExcalidrawElement[];
  appState: AppState;
  onPropertyChange: (updates: Partial<AppState>) => void;
}

export function PropertiesPanel({ appState, onPropertyChange }: PropertiesPanelProps) {
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

  return (
    <div className="panel">
      <h3>Properties</h3>

      {/* Stroke Color */}
      <div className="panel-row">
        <div className="panel-label">Stroke</div>
        <div className="swatches">
          {strokeColors.map((color) => (
            <button
              key={color}
              className={`swatch ${appState.currentItemStrokeColor === color ? 'selected' : ''}`}
              style={{ backgroundColor: color === 'transparent' ? '#fff' : color }}
              onClick={() => onPropertyChange({ currentItemStrokeColor: color })}
              title={color}
              aria-label={`Stroke color: ${color}`}
            >
              {color === 'transparent' && (
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  background: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                  backgroundSize: '4px 4px',
                  backgroundPosition: '0 0, 0 2px, 2px -2px, -2px 0px'
                }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Background Color */}
      <div className="panel-row">
        <div className="panel-label">Background</div>
        <div className="swatches">
          {backgroundColors.map((color) => (
            <button
              key={color}
              className={`swatch ${appState.currentItemBackgroundColor === color ? 'selected' : ''}`}
              style={{ backgroundColor: color === 'transparent' ? '#fff' : color }}
              onClick={() => onPropertyChange({ currentItemBackgroundColor: color })}
              title={color}
              aria-label={`Background color: ${color}`}
            >
              {color === 'transparent' && (
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  background: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                  backgroundSize: '4px 4px',
                  backgroundPosition: '0 0, 0 2px, 2px -2px, -2px 0px'
                }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Fill Style */}
      <div className="panel-row">
        <div className="panel-label">Fill</div>
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
      <div className="panel-row">
        <div className="panel-label">Stroke width</div>
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
      <div>
        <div className="panel-label">Sloppiness</div>
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
      <div>
        <div className="panel-label">Opacity — {appState.currentItemOpacity}%</div>
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
  );
}
