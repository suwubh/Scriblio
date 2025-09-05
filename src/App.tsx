// src/App.tsx
import { useRef, useState } from 'react';
import { ExcalidrawCanvas, ExcalidrawCanvasRef } from './components/ExcalidrawCanvas';
import { Toolbar } from './components/Toolbar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Footer } from './components/Footer';
import { useExcalidrawState } from './hooks/useExcalidrawState';
import './styles/excalidraw.css';

export default function App() {
  const {
    elements,
    appState,
    updateAppState,
    clearCanvas,
    addElement,
    updateElement,
    deleteElements,
    undo,
    redo,
    canUndo,
    canRedo,
    setCanvasAppRef,
  } = useExcalidrawState();

  const canvasRef = useRef<ExcalidrawCanvasRef | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleToolChange = (tool: string) => {
    updateAppState({ activeTool: tool as any });
  };

  const handleToggleToolLock = () => {
    updateAppState({ isToolLocked: !appState.isToolLocked });
  };

  const handleClear = () => {
    clearCanvas();
    canvasRef.current?.clearCanvas();
  };

  const handleExport = () => {
    try {
      const jsonData = canvasRef.current?.exportToJSON();
      if (jsonData) {
        const dataBlob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `excalidraw-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const jsonData = e.target?.result as string;
            const data = JSON.parse(jsonData);
            clearCanvas();
            canvasRef.current?.clearCanvas();
            if (data.elements && Array.isArray(data.elements)) {
              data.elements.forEach((element: any) => addElement(element));
            }
            if (data.appState) {
              updateAppState(data.appState);
            }
            console.log('Import successful!');
          } catch (error) {
            console.error('Failed to import:', error);
            alert('Failed to import file. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const selectedElements = elements.filter(el =>
    appState.selectedElementIds.includes(el.id)
  );

  return (
    <div className="app-shell">
      <div className="topbar">
        <Toolbar
          activeTool={appState.activeTool}
          onToolChange={handleToolChange}
          isToolLocked={appState.isToolLocked}
          onToggleToolLock={handleToggleToolLock}
        />
        
        {/* Hamburger Menu Button */}
        <div className="hamburger-container">
          <button
            className={`hamburger-btn ${isPanelOpen ? 'active' : ''}`}
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            aria-label="Toggle properties panel"
          >
            <span className="hamburger-icon">☰</span>
          </button>
        </div>
      </div>

      <div className="content">
        <div className="canvas-wrap">
          <ExcalidrawCanvas
            ref={canvasRef}
            elements={elements}
            appState={appState}
            onElementsChange={() => {}}
            onAppStateChange={updateAppState}
            onCanvasAppReady={setCanvasAppRef}
          />
        </div>

        {/* Slide-out Properties Panel */}
        <PropertiesPanel
          selectedElements={selectedElements}
          appState={appState}
          onPropertyChange={updateAppState}
          isOpen={isPanelOpen}
          onClose={() => setIsPanelOpen(false)}
          onClear={handleClear}
          onExport={handleExport}
          onImport={handleImport}
        />
      </div>

      {/* Overlay when panel is open */}
      {isPanelOpen && (
        <div 
          className="panel-overlay" 
          onClick={() => setIsPanelOpen(false)}
        />
      )}

      <Footer
        viewTransform={appState.viewTransform}
        selectedCount={selectedElements.length}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
    </div>
  );
}
