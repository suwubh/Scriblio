// src/components/ExcalidrawCanvas.tsx
import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { CanvasApp } from './Canvas';
import { ExcalidrawElement, AppState } from '../types/excalidraw';

interface ExcalidrawCanvasProps {
  elements: ExcalidrawElement[];
  appState: AppState;
  onElementsChange: (elements: ExcalidrawElement[]) => void;
  onAppStateChange: (appState: Partial<AppState>) => void;
}

export interface ExcalidrawCanvasRef {
  clearCanvas: () => void;
  exportToJSON: () => string;
  importFromJSON: (json: string) => void;
}

export const ExcalidrawCanvas = forwardRef<ExcalidrawCanvasRef, ExcalidrawCanvasProps>(
  ({ appState, onAppStateChange, elements }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const appRef = useRef<CanvasApp | null>(null);

    useImperativeHandle(ref, () => ({
      clearCanvas: () => {
        if (appRef.current) {
          appRef.current.clear();
        }
      },
      exportToJSON: () => {
        return appRef.current?.exportToJSON() || '{}';
      },
      importFromJSON: (json: string) => {
        if (appRef.current) {
          appRef.current.importFromJSON(json);
        }
      }
    }));

    useEffect(() => {
      if (canvasRef.current && !appRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
        
        // Pass the appState to the CanvasApp constructor
        appRef.current = new CanvasApp(canvasRef.current, appState);

        const handleResize = () => {
          if (canvasRef.current && appRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            canvasRef.current.width = rect.width;
            canvasRef.current.height = rect.height;
            appRef.current.resize();
          }
        };

        window.addEventListener('resize', handleResize);
        return () => {
          window.removeEventListener('resize', handleResize);
        };
      }
    }, []);

    // Update canvas app state when React state changes
    useEffect(() => {
      if (appRef.current) {
        appRef.current.updateAppState(appState);
      }
    }, [appState]);

    // Sync elements between React state and canvas engine
    useEffect(() => {
      if (appRef.current && elements !== undefined) {
        appRef.current.setElements(elements);
      }
    }, [elements]);

    return (
      <div className="canvas-wrap">
        <canvas
          ref={canvasRef}
          className="excalidraw-canvas"
          tabIndex={0}
        />
      </div>
    );
  }
);

ExcalidrawCanvas.displayName = 'ExcalidrawCanvas';
