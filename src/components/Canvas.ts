// src/components/Canvas.ts
import { CanvasRenderer } from '../engine/renderer';
import { EventHandler } from '../engine/eventHandler';
import { AppState, ExcalidrawElement } from '../types/excalidraw';

export class CanvasApp {
  private canvas: HTMLCanvasElement;
  private renderer: CanvasRenderer;
  private eventHandler: EventHandler;
  private appState: AppState;
  private animationId: number | null = null;

  // Callbacks
  private onElementsChanged?: (elements: ExcalidrawElement[]) => void;
  private onAppStateChanged?: (appState: AppState) => void;

  // State tracking
  private lastElementsHash = '';
  private lastAppStateHash = '';

  constructor(canvasElement: HTMLCanvasElement, initialAppState: AppState) {
    this.canvas = canvasElement;
    this.appState = { ...initialAppState };
    this.renderer = new CanvasRenderer(this.canvas);
    this.eventHandler = new EventHandler(this.canvas, this.appState);
    
    this.setupCanvas();
    this.setupEventHandlers();
    this.startRenderLoop();
  }

  /**
   * Set callback for when elements are mutated by the engine
   */
  public setOnElementsMutated(callback: (elements: ExcalidrawElement[]) => void) {
    this.onElementsChanged = callback;
  }

  /**
   * Set callback for when app state is mutated by the engine
   */
  public setOnAppStateMutated(callback: (appState: AppState) => void) {
    this.onAppStateChanged = callback;
  }

  /**
   * Setup event handlers from the engine
   */
  private setupEventHandlers() {
    // When event handler modifies elements, notify React
    this.eventHandler.setOnElementsChanged((elements) => {
      if (this.onElementsChanged) {
        this.onElementsChanged(elements);
      }
    });
  }

  /**
   * Setup canvas dimensions and DPI scaling
   */
  private setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const container = this.canvas.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();

    // Set canvas size
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    const ctx = this.canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    // Set CSS size
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';

    // Update app state dimensions
    this.appState.width = rect.width;
    this.appState.height = rect.height;
  }

  /**
   * Main render loop
   */
  private startRenderLoop() {
    const render = () => {
      const elements = this.eventHandler.getElements();
      const elementsToRender = [...elements];

      // Add editing element if present
      if (this.appState.editingElement) {
        elementsToRender.push(this.appState.editingElement);
      }

      // Get selection rectangle
      const selectionRect = this.eventHandler.getSelectionRect();

      // Render to canvas
      this.renderer.render(elementsToRender, this.appState, selectionRect);

      // Check for element changes
      this.checkElementsChanged(elements);

      // Check for app state changes
      this.checkAppStateChanged();

      this.animationId = requestAnimationFrame(render);
    };
    
    render();
  }

  /**
   * Check if elements have changed and notify
   */
  private checkElementsChanged(elements: ExcalidrawElement[]) {
    const hash = this.hashElements(elements);
    
    if (hash !== this.lastElementsHash) {
      this.lastElementsHash = hash;
      
      console.log('🎨 Elements changed, notifying React. Count:', elements.length);
      
      if (this.onElementsChanged) {
        const deepCopy = JSON.parse(JSON.stringify(elements)) as ExcalidrawElement[];
        this.onElementsChanged(deepCopy);
      } else {
        console.warn('⚠️ onElementsChanged callback not set!');
      }
    }
  }

  /**
   * Check if app state has changed and notify
   */
  private checkAppStateChanged() {
    const hash = this.hashAppState();
    
    if (hash !== this.lastAppStateHash) {
      this.lastAppStateHash = hash;
      
      if (this.onAppStateChanged) {
        this.onAppStateChanged({ ...this.appState });
      }
    }
  }

  /**
   * Generate hash for elements
   */
  private hashElements(elements: ExcalidrawElement[]): string {
    return elements
      .map(el => `${el.id}:${el.x}:${el.y}:${el.width}:${el.height}:${el.updated}`)
      .join('|');
  }

  /**
   * Generate hash for app state
   */
  private hashAppState(): string {
    return [
      this.appState.viewTransform.x,
      this.appState.viewTransform.y,
      this.appState.viewTransform.zoom,
      this.appState.selectedElementIds.join(','),
      this.appState.activeTool,
    ].join(':');
  }

  /**
   * Update app state from external source (React)
   */
  public updateAppState(newAppState: AppState) {
    this.appState = { ...newAppState };
    this.eventHandler.updateAppState(this.appState);
  }

  /**
   * Set elements from external source (React)
   */
  public setElements(elements: ExcalidrawElement[]) {
    this.eventHandler.setElements(elements);
    this.lastElementsHash = this.hashElements(elements);
  }

  /**
   * Clear all elements
   */
  public clear() {
    this.eventHandler.clearElements();
    this.lastElementsHash = '';
  }

  /**
   * Export to JSON
   */
  public exportToJSON(): string {
    return JSON.stringify(
      {
        elements: this.eventHandler.getElements(),
        appState: {
          viewTransform: this.appState.viewTransform,
        },
      },
      null,
      2
    );
  }

  /**
   * Import from JSON
   */
  public importFromJSON(json: string) {
    try {
      const data = JSON.parse(json);
      
      if (data.elements && Array.isArray(data.elements)) {
        this.eventHandler.setElements(data.elements);
        this.lastElementsHash = this.hashElements(data.elements);
      }

      if (data.appState) {
        this.updateAppState({ ...this.appState, ...data.appState });
      }

      console.log('✅ Import successful');
    } catch (error) {
      console.error('❌ Import failed:', error);
    }
  }

  /**
   * Resize canvas
   */
  public resize() {
    this.setupCanvas();
  }

  /**
   * Get current app state
   */
  public getAppState(): AppState {
    return this.appState;
  }

  /**
   * Cleanup
   */
  public destroy() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}