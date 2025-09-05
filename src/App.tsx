// src/App.tsx
import { useRef } from 'react';
import { ExcalidrawCanvas, ExcalidrawCanvasRef } from './components/ExcalidrawCanvas';
import { Toolbar } from './components/Toolbar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { MainMenu } from './components/MainMenu';
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
    deleteElements
  } = useExcalidrawState();

  const canvasRef = useRef<ExcalidrawCanvasRef>(null);

  const handleToolChange = (tool: string) => {
    updateAppState({ activeTool: tool as any });
  };

  const handleToggleToolLock = () => {
    updateAppState({ isToolLocked: !appState.isToolLocked });
  };

  const handleClear = () => {
    // Clear both React state AND canvas engine state
    clearCanvas(); // Clears React state
    canvasRef.current?.clearCanvas(); // Clears canvas engine state
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
            
            // Clear both states first
            clearCanvas();
            canvasRef.current?.clearCanvas();
            
            // Import elements
            if (data.elements && Array.isArray(data.elements)) {
              data.elements.forEach((element: any) => addElement(element));
            }
            
            // Import app state
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
        <div className="toolbar">
          <Toolbar 
            activeTool={appState.activeTool}
            onToolChange={handleToolChange}
            isToolLocked={appState.isToolLocked}
            onToggleToolLock={handleToggleToolLock}
          />
          <div className="spacer" />
          <MainMenu 
            onClear={handleClear} 
            onExport={handleExport} 
            onImport={handleImport} 
          />
        </div>
      </div>

      <div className="content">
        <ExcalidrawCanvas 
          ref={canvasRef}
          elements={elements}
          appState={appState}
          onElementsChange={() => {}}
          onAppStateChange={updateAppState}
        />
        
        <div className="sidepanel">
          <PropertiesPanel 
            selectedElements={selectedElements}
            appState={appState}
            onPropertyChange={updateAppState}
          />
        </div>
      </div>

      <Footer 
        viewTransform={appState.viewTransform}
        selectedCount={selectedElements.length}
      />
    </div>
  );
}
