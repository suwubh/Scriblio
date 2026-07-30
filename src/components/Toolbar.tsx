import { AppState, ToolType } from '../types/scriblio';

interface ToolbarProps {
  appState: AppState;
  activeTool: string;
  isToolLocked: boolean;
  onToolChange: (tool: string) => void;
  onToggleToolLock: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function Toolbar({ activeTool, onToolChange }: ToolbarProps) {
  const tools = [
    { type: 'selection' as ToolType, icon: '⬚', label: 'Selection — V', shortcut: 'V' },
    { type: 'rectangle' as ToolType, icon: '▭', label: 'Rectangle — R', shortcut: 'R' },
    { type: 'ellipse' as ToolType, icon: '○', label: 'Ellipse — O', shortcut: 'O' },
    { type: 'diamond' as ToolType, icon: '◊', label: 'Diamond — D', shortcut: 'D' },
    { type: 'arrow' as ToolType, icon: '→', label: 'Arrow — A', shortcut: 'A' },
    { type: 'line' as ToolType, icon: '/', label: 'Line — L', shortcut: 'L' },
    { type: 'freedraw' as ToolType, icon: '✎', label: 'Draw — P', shortcut: 'P' },
    { type: 'text' as ToolType, icon: 'T', label: 'Text — T', shortcut: 'T' },
    { type: 'image' as ToolType, icon: '🖼', label: 'Image', shortcut: '' },
    { type: 'eraser' as ToolType, icon: '🗑', label: 'Eraser — E', shortcut: 'E' }
  ];

  return (
    <div className="toolbar">
      {tools.map((tool) => (
        <button
          key={tool.type}
          className={`tool-btn ${activeTool === tool.type ? 'active' : ''}`}
          onClick={() => onToolChange(tool.type)}
          title={tool.label}
          aria-label={tool.label}
        >
          <span className="tool-icon">{tool.icon}</span>
        </button>
      ))}
      </div>
  );
}
