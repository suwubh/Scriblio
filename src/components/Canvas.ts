// src/components/Canvas.ts
import { CanvasRenderer } from '../engine/renderer';
import { EventHandler } from '../engine/eventHandler';
import { AppState, ExcalidrawElement } from '../types/excalidraw';

export class CanvasApp {
  private canvas: HTMLCanvasElement;
  private renderer: CanvasRenderer;
  private eventHandler: EventHandler;
  private appState: AppState;

  constructor(canvasElement: HTMLCanvasElement, initialAppState: AppState) {
    this.canvas = canvasElement;
    this.appState = { ...initialAppState };
    this.renderer = new CanvasRenderer(this.canvas);
    this.eventHandler = new EventHandler(this.canvas, this.appState);
    this.setupCanvas();
    this.startRenderLoop();
  }

  private setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    const ctx = this.canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
  }

  private startRenderLoop() {
    const render = () => {
      const elements = this.eventHandler.getElements();
      const elementsToRender = [...elements];
      
      if (this.appState.editingElement) {
        elementsToRender.push(this.appState.editingElement);
      }

      this.renderer.render(elementsToRender, this.appState);
      requestAnimationFrame(render);
    };
    render();
  }

  // Add method to update app state from React
  public updateAppState(newAppState: AppState) {
    this.appState = { ...newAppState };
    this.eventHandler.updateAppState(this.appState);
  }

  // Add method to set elements from React state
  public setElements(elements: ExcalidrawElement[]) {
    this.eventHandler.setElements(elements);
  }

  public setTool(tool: string) {
    this.appState.activeTool = tool as any;
    this.appState.selectedElementIds = [];
  }

  public setStrokeColor(color: string) {
    this.appState.currentItemStrokeColor = color;
  }

  public setBackgroundColor(color: string) {
    this.appState.currentItemBackgroundColor = color;
  }

  public setFillStyle(fillStyle: 'hachure' | 'cross-hatch' | 'solid' | 'zigzag' | 'dots') {
    this.appState.currentItemFillStyle = fillStyle;
  }

  public setStrokeWidth(width: number) {
    this.appState.currentItemStrokeWidth = width;
  }

  public setStrokeStyle(style: 'solid' | 'dashed' | 'dotted') {
    this.appState.currentItemStrokeStyle = style;
  }

  public setRoughness(roughness: number) {
    this.appState.currentItemRoughness = roughness;
  }

  public setOpacity(opacity: number) {
    this.appState.currentItemOpacity = opacity;
  }

  public clear() {
    this.eventHandler.clearElements();
  }

  public exportToJSON(): string {
    return JSON.stringify({
      elements: this.eventHandler.getElements(),
      appState: {
        viewTransform: this.appState.viewTransform
      }
    }, null, 2);
  }

  public importFromJSON(json: string) {
    try {
      const data = JSON.parse(json);
      if (data.elements && Array.isArray(data.elements)) {
        this.eventHandler.setElements(data.elements);
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
  }

  public getAppState(): AppState {
    return this.appState;
  }

  public getEventHandler(): EventHandler {
    return this.eventHandler;
  }
}
