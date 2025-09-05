// src/components/Toolbar.tsx
import { ToolType } from '../types/excalidraw';

interface ToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  isToolLocked: boolean;
  onToggleToolLock: () => void;
}

export function Toolbar({ activeTool, onToolChange, isToolLocked, onToggleToolLock }: ToolbarProps) {
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

        <span
  aria-hidden="true"
  style={{
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%) translateY(1px)',
    pointerEvents: 'none',
    fontFamily: "'Fredoka One','Luckiest Guy','Chewy','Baloo 2','Comic Sans MS',cursive",
    fontWeight: 700,
    fontSize: '3.8rem',
    letterSpacing: '2px',
    userSelect: 'none',
    display: 'flex', // so we can color each letter
    gap: '2px'
  }}
>
  {['S','c','r','i','b','l','i','o'].map((char, i) => (
    <span
      key={i}
      style={{
        color: ['#ff5252','#ffca28','#4caf50','#29b6f6','#ab47bc','#ff9800','#ec407a','#66bb6a'][i % 8],
        textShadow: `
          -3px -3px 0 #000,
           3px -3px 0 #000,
          -3px  3px 0 #000,
           3px  3px 0 #000
        `,
        filter: 'drop-shadow(0 3px 2px rgba(0,0,0,0.5))'
      }}
    >
      {char}
    </span>
  ))}
</span>


      
      <div className="spacer" />
      
      <button
        className={`tool-btn ${isToolLocked ? 'active' : ''}`}
        onClick={onToggleToolLock}
        title="Lock tool"
        aria-label="Lock tool"
      >
        🔒
      </button>
    </div>
  );
}
