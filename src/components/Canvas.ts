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

  // Callbacks to publish engine mutations up to React
  private onElementsMutated?: (elements: ExcalidrawElement[]) => void;
  private onAppStateMutated?: (appState: AppState) => void;

  // Lightweight change signatures to prevent feedback loops
  private lastElementsSig = '';
  private lastAppStateSig = '';
  private lastElementsCount = 0;

  constructor(canvasElement: HTMLCanvasElement, initialAppState: AppState) {
    this.canvas = canvasElement;
    this.appState = { ...initialAppState };
    this.renderer = new CanvasRenderer(this.canvas);
    this.eventHandler = new EventHandler(this.canvas, this.appState);
    this.setupCanvas();
    this.startRenderLoop();
    this.eventHandler.setOnElementsChanged((elements) => {
    if (this.onElementsMutated) {
      this.onElementsMutated(elements);
    }
  });
  }

  public setOnElementsMutated(cb: (elements: ExcalidrawElement[]) => void) {
    this.onElementsMutated = cb;
  }

  public setOnAppStateMutated(cb: (appState: AppState) => void) {
    this.onAppStateMutated = cb;
  }

  private setupCanvas() {
  const dpr = window.devicePixelRatio || 1;
  
  // Get actual container size
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

  private startRenderLoop() {
    const render = () => {
      const elements = this.eventHandler.getElements();
      const elementsToRender = [...elements];

      if (this.appState.editingElement) {
        elementsToRender.push(this.appState.editingElement);
      }

      const selectionRect = this.eventHandler.getSelectionRect();
      this.renderer.render(elementsToRender, this.appState, selectionRect);

      // Only publish significant element changes
      const hasElementsChanged = this.hasElementsChanged(elements);
      if (hasElementsChanged && this.onElementsMutated) {
        const deepCopy = JSON.parse(JSON.stringify(elements)) as ExcalidrawElement[];
        this.onElementsMutated(deepCopy);
      }

      // Publish appState changes (view transform, selection, etc.)
      const appSig = this.generateAppStateSignature(this.appState);
      if (appSig !== this.lastAppStateSig && this.onAppStateMutated) {
        this.lastAppStateSig = appSig;
        this.onAppStateMutated({ ...this.appState });
      }

      this.animationId = requestAnimationFrame(render);
    };
    render();
  }

  private hasElementsChanged(elements: ExcalidrawElement[]): boolean {
    // Check if elements count changed
    if (elements.length !== this.lastElementsCount) {
      this.lastElementsCount = elements.length;
      this.lastElementsSig = this.generateElementsSignature(elements);
      return true;
    }

    // Check for meaningful changes in existing elements
    const currentSig = this.generateElementsSignature(elements);
    if (currentSig !== this.lastElementsSig) {
      this.lastElementsSig = currentSig;
      return true;
    }

    return false;
  }

  private generateElementsSignature(elements: ExcalidrawElement[]): string {
    return elements
      .map(el => `${el.id}:${el.x}:${el.y}:${el.width}:${el.height}:${el.updated}`)
      .join('|');
  }

  private generateAppStateSignature(appState: AppState): string {
    return `${appState.viewTransform.x}:${appState.viewTransform.y}:${appState.viewTransform.zoom}:${appState.selectedElementIds.join(',')}`;
  }

  public updateAppState(newAppState: AppState) {
    this.appState = { ...newAppState };
    this.eventHandler.updateAppState(this.appState);
    this.lastAppStateSig = this.generateAppStateSignature(this.appState);
  }

  public setElements(elements: ExcalidrawElement[]) {
    this.eventHandler.setElements(elements);
    this.lastElementsCount = elements.length;
    this.lastElementsSig = this.generateElementsSignature(elements);
  }

  public clear() {
    this.eventHandler.clearElements();
    this.lastElementsCount = 0;
    this.lastElementsSig = '';
  }

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

  public importFromJSON(json: string) {
    try {
      const data = JSON.parse(json);
      if (data.elements && Array.isArray(data.elements)) {
        this.eventHandler.setElements(data.elements);
        this.lastElementsCount = data.elements.length;
        this.lastElementsSig = this.generateElementsSignature(data.elements);
      }

      if (data.appState) {
        this.updateAppState({ ...this.appState, ...data.appState });
      }

      console.log('Canvas import successful!');
    } catch (error) {
      console.error('Failed to import JSON in canvas:', error);
    }
  }

  public resize() {
    this.setupCanvas();
    this.startRenderLoop();
  }

  public getAppState(): AppState {
    return this.appState;
  }

  public destroy() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}
