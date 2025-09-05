// src/components/ExcalidrawCanvas.tsx
import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { CanvasApp } from './Canvas';
import { ExcalidrawElement, AppState } from '../types/excalidraw';

interface ExcalidrawCanvasProps {
  elements: ExcalidrawElement[];
  appState: AppState;
  onElementsChange: (elements: ExcalidrawElement[]) => void;
  onAppStateChange: (appState: Partial<AppState>) => void;
  onCanvasAppReady?: (canvasApp: CanvasApp) => void;
}

export interface ExcalidrawCanvasRef {
  clearCanvas: () => void;
  exportToJSON: () => string;
  importFromJSON: (json: string) => void;
}

export const ExcalidrawCanvas = forwardRef<ExcalidrawCanvasRef, ExcalidrawCanvasProps>(
  ({ appState, onAppStateChange, elements, onCanvasAppReady }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
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
        // Create canvas app once
        appRef.current = new CanvasApp(canvasRef.current, appState);
        
        // Notify parent component that canvas app is ready
        if (onCanvasAppReady) {
          onCanvasAppReady(appRef.current);
        }

        // Handle resize
        const handleResize = () => {
          if (canvasRef.current && appRef.current) {
            appRef.current.resize();
          }
        };
        window.addEventListener('resize', handleResize);
        return () => {
          window.removeEventListener('resize', handleResize);
        };
      }
    }, [onCanvasAppReady]);

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

    // Toggle eraser cursor based on active tool
    useEffect(() => {
      if (!canvasRef.current) return;
      if (appState.activeTool === 'eraser') {
        canvasRef.current.classList.add('cursor-eraser');
      } else {
        canvasRef.current.classList.remove('cursor-eraser');
      }
    }, [appState.activeTool]);

    return (
      <canvas
        ref={canvasRef}
        className="excalidraw-canvas"
        aria-label="Excalidraw canvas"
      />
    );
  }
);

ExcalidrawCanvas.displayName = 'ExcalidrawCanvas';
