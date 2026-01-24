
import { CanvasRenderer } from '../engine/renderer';
import { EventHandler } from '../engine/eventHandler';
import { AppState, ExcalidrawElement } from '../types/excalidraw';

export class CanvasApp {
  private canvas: HTMLCanvasElement;
  private renderer: CanvasRenderer;
  private eventHandler: EventHandler;
  private appState: AppState;
  private animationId: number | null = null;
  private isDestroyed = false; 

  
  private onElementsMutated?: (elements: ExcalidrawElement[]) => void;
  private onAppStateMutated?: (appState: AppState) => void;

  
  private lastElementsSig = '';
  private lastAppStateSig = '';
  private lastElementsCount = 0;

  constructor(canvasElement: HTMLCanvasElement, initialAppState: AppState) {
    this.canvas = canvasElement;
    this.appState = { ...initialAppState };
    this.renderer = new CanvasRenderer(this.canvas);
    this.eventHandler = new EventHandler(this.canvas, this.appState);
    
    this.eventHandler.setOnElementsChanged((elements) => {
      if (this.onElementsMutated && !this.isDestroyed) {
        this.onElementsMutated(elements);
      }
    });
    
    this.setupCanvas();
    this.startRenderLoop();
  }

  public setOnElementsMutated(cb: (elements: ExcalidrawElement[]) => void) {
    this.onElementsMutated = cb;
  }

  public setOnAppStateMutated(cb: (appState: AppState) => void) {
    this.onAppStateMutated = cb;
  }

  private setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    
    const container = this.canvas.parentElement;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    const ctx = this.canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    
    this.appState.width = rect.width;
    this.appState.height = rect.height;
  }

  private startRenderLoop() {
    
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    
    if (this.isDestroyed) {
      return;
    }

    const render = () => {
      
      if (this.isDestroyed) {
        return;
      }

      const elements = this.eventHandler.getElements();
      const elementsToRender = [...elements];

      if (this.appState.editingElement) {
        elementsToRender.push(this.appState.editingElement);
      }

      const selectionRect = this.eventHandler.getSelectionRect();
      this.renderer.render(elementsToRender, this.appState, selectionRect);

      const hasElementsChanged = this.hasElementsChanged(elements);
      if (hasElementsChanged && this.onElementsMutated && !this.isDestroyed) {
        const deepCopy = JSON.parse(JSON.stringify(elements)) as ExcalidrawElement[];
        this.onElementsMutated(deepCopy);
      }

      const appSig = this.generateAppStateSignature(this.appState);
      if (appSig !== this.lastAppStateSig && this.onAppStateMutated && !this.isDestroyed) {
        this.lastAppStateSig = appSig;
        this.onAppStateMutated({ ...this.appState });
      }

      
      if (!this.isDestroyed) {
        this.animationId = requestAnimationFrame(render);
      }
    };
    
    render();
  }

  private hasElementsChanged(elements: ExcalidrawElement[]): boolean {
    if (elements.length !== this.lastElementsCount) {
      this.lastElementsCount = elements.length;
      this.lastElementsSig = this.generateElementsSignature(elements);
      return true;
    }

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
    if (this.isDestroyed) return;
    
    this.appState = { ...newAppState };
    this.eventHandler.updateAppState(this.appState);
    this.lastAppStateSig = this.generateAppStateSignature(this.appState);
  }

  public setElements(elements: ExcalidrawElement[]) {
    if (this.isDestroyed) return;
    
    this.eventHandler.setElements(elements);
    this.lastElementsCount = elements.length;
    this.lastElementsSig = this.generateElementsSignature(elements);
  }

  public clear() {
    if (this.isDestroyed) return;
    
    this.eventHandler.clearElements();
    this.lastElementsCount = 0;
    this.lastElementsSig = '';
  }

  public exportToJSON(): string {
    if (this.isDestroyed) return '{}';
    
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
    if (this.isDestroyed) return;
    
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
    if (this.isDestroyed) return;
    
    this.setupCanvas();
    
  }

  public getAppState(): AppState {
    return this.appState;
  }

  public destroy() {
    
    this.isDestroyed = true;

    
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    
    if (this.eventHandler) {
      this.eventHandler.destroy();
    }

    
    this.onElementsMutated = undefined;
    this.onAppStateMutated = undefined;
  }
}