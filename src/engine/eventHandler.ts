// src/engine/eventHandler.ts
import { ExcalidrawElement, AppState, Point } from '../types/excalidraw';

export class EventHandler {
  private canvas: HTMLCanvasElement;
  private elements: ExcalidrawElement[] = [];
  private appState: AppState;
  private isDrawing = false;

  constructor(canvas: HTMLCanvasElement, appState: AppState) {
    this.canvas = canvas;
    this.appState = appState;
    this.setupEventListeners();
  }

  // Add method to update app state
  public updateAppState(newAppState: AppState) {
    this.appState = newAppState;
  }

  // Add method to set elements from external state
  public setElements(elements: ExcalidrawElement[]) {
    this.elements = [...elements];
    this.appState.selectedElementIds = [];
  }

  private setupEventListeners() {
    this.canvas.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    this.canvas.addEventListener('pointermove', this.handlePointerMove.bind(this));
    this.canvas.addEventListener('pointerup', this.handlePointerUp.bind(this));
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
  }

  private handlePointerDown(event: PointerEvent) {
    const point = this.getCanvasPoint(event);
    this.isDrawing = true;

    switch (this.appState.activeTool) {
      case 'rectangle':
      case 'ellipse':
      case 'diamond':
      case 'arrow':
        this.startCreatingElement(this.appState.activeTool, point);
        break;
      case 'line':
        this.startCreatingLine(point);
        break;
      case 'freedraw':
        this.startDrawing(point);
        break;
      case 'selection':
        this.handleSelection(point);
        break;
      case 'text':
        this.startCreatingText(point);
        break;
    }
  }

  private handlePointerMove(event: PointerEvent) {
    if (!this.isDrawing) return;
    
    const point = this.getCanvasPoint(event);
    
    if (this.appState.editingElement) {
      if (this.appState.activeTool === 'freedraw') {
        this.addPointToDrawing(point);
      } else {
        this.updateEditingElement(point);
      }
    }
  }

  private handlePointerUp(_event: PointerEvent) {
    this.isDrawing = false;
    if (this.appState.editingElement) {
      this.finalizeElement();
    }
  }

  private startCreatingElement(type: string, point: Point) {
    const element: ExcalidrawElement = {
      id: this.generateId(),
      type: type as any,
      x: point.x,
      y: point.y,
      width: 0,
      height: 0,
      angle: 0,
      strokeColor: this.appState.currentItemStrokeColor,
      backgroundColor: this.appState.currentItemBackgroundColor,
      fillStyle: this.appState.currentItemFillStyle,
      strokeWidth: this.appState.currentItemStrokeWidth,
      strokeStyle: this.appState.currentItemStrokeStyle,
      roughness: this.appState.currentItemRoughness,
      opacity: this.appState.currentItemOpacity / 100,
      seed: Math.floor(Math.random() * 1000000),
      versionNonce: Math.floor(Math.random() * 1000000),
      isDeleted: false,
      groupIds: [],
      updated: Date.now()
    };
    this.appState.editingElement = element;
  }

  private startCreatingLine(point: Point) {
    const element: ExcalidrawElement = {
      id: this.generateId(),
      type: 'line',
      x: point.x,
      y: point.y,
      width: 0,
      height: 0,
      angle: 0,
      strokeColor: this.appState.currentItemStrokeColor,
      backgroundColor: 'transparent',
      fillStyle: this.appState.currentItemFillStyle,
      strokeWidth: this.appState.currentItemStrokeWidth,
      strokeStyle: this.appState.currentItemStrokeStyle,
      roughness: this.appState.currentItemRoughness,
      opacity: this.appState.currentItemOpacity / 100,
      seed: Math.floor(Math.random() * 1000000),
      versionNonce: Math.floor(Math.random() * 1000000),
      isDeleted: false,
      groupIds: [],
      updated: Date.now(),
      points: [{ x: 0, y: 0 }]
    };
    this.appState.editingElement = element;
  }

  private startDrawing(point: Point) {
    const element: ExcalidrawElement = {
      id: this.generateId(),
      type: 'freedraw',
      x: point.x,
      y: point.y,
      width: 0,
      height: 0,
      angle: 0,
      strokeColor: this.appState.currentItemStrokeColor,
      backgroundColor: 'transparent',
      fillStyle: this.appState.currentItemFillStyle,
      strokeWidth: this.appState.currentItemStrokeWidth,
      strokeStyle: this.appState.currentItemStrokeStyle,
      roughness: this.appState.currentItemRoughness,
      opacity: this.appState.currentItemOpacity / 100,
      seed: Math.floor(Math.random() * 1000000),
      versionNonce: Math.floor(Math.random() * 1000000),
      isDeleted: false,
      groupIds: [],
      updated: Date.now(),
      points: [{ x: 0, y: 0 }]
    };
    this.appState.editingElement = element;
  }

  private startCreatingText(point: Point) {
    const text = prompt('Enter text:');
    if (!text) return;

    const element: ExcalidrawElement = {
      id: this.generateId(),
      type: 'text',
      x: point.x,
      y: point.y,
      width: text.length * 12,
      height: 20,
      angle: 0,
      strokeColor: this.appState.currentItemStrokeColor,
      backgroundColor: 'transparent',
      fillStyle: this.appState.currentItemFillStyle,
      strokeWidth: this.appState.currentItemStrokeWidth,
      strokeStyle: this.appState.currentItemStrokeStyle,
      roughness: this.appState.currentItemRoughness,
      opacity: this.appState.currentItemOpacity / 100,
      seed: Math.floor(Math.random() * 1000000),
      versionNonce: Math.floor(Math.random() * 1000000),
      isDeleted: false,
      groupIds: [],
      updated: Date.now(),
      text: text,
      fontSize: this.appState.currentItemFontSize,
      fontFamily: this.appState.currentItemFontFamily,
      textAlign: this.appState.currentItemTextAlign
    };
    this.elements.push(element);
  }

  private addPointToDrawing(point: Point) {
    if (!this.appState.editingElement) return;
    
    const element = this.appState.editingElement;
    if (!element.points) {
      element.points = [];
    }

    const relativePoint = {
      x: point.x - element.x,
      y: point.y - element.y
    };
    element.points.push(relativePoint);

    if (element.points.length > 1) {
      const minX = Math.min(...element.points.map(p => p.x));
      const maxX = Math.max(...element.points.map(p => p.x));
      const minY = Math.min(...element.points.map(p => p.y));
      const maxY = Math.max(...element.points.map(p => p.y));

      element.width = Math.max(1, maxX - minX);
      element.height = Math.max(1, maxY - minY);

      if (minX < 0) {
        element.x += minX;
        element.points = element.points.map(p => ({ x: p.x - minX, y: p.y }));
      }

      if (minY < 0) {
        element.y += minY;
        element.points = element.points.map(p => ({ x: p.x, y: p.y - minY }));
      }
    }
  }

  private updateEditingElement(point: Point) {
    if (!this.appState.editingElement) return;
    
    const element = this.appState.editingElement;
    
    if (element.type === 'line' && element.points) {
      element.width = point.x - element.x;
      element.height = point.y - element.y;
      element.points[1] = { x: element.width, y: element.height };
    } else {
      element.width = point.x - element.x;
      element.height = point.y - element.y;
    }
  }

  private finalizeElement() {
    if (this.appState.editingElement) {
      const element = this.appState.editingElement;
      
      if (element.type === 'freedraw' || element.type === 'line') {
        if (element.points && element.points.length > 1) {
          this.elements.push(element);
        }
      } else if (Math.abs(element.width) > 3 || Math.abs(element.height) > 3) {
        this.elements.push(element);
      }

      this.appState.editingElement = null;
    }
  }

  private handleSelection(point: Point) {
    const clickedElement = this.getElementAtPoint(point);
    if (clickedElement) {
      this.appState.selectedElementIds = [clickedElement.id];
    } else {
      this.appState.selectedElementIds = [];
    }
  }

  private handleWheel(event: WheelEvent) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, this.appState.viewTransform.zoom * delta));
    
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    const zoomChange = newZoom / this.appState.viewTransform.zoom;
    this.appState.viewTransform.x = mouseX - (mouseX - this.appState.viewTransform.x) * zoomChange;
    this.appState.viewTransform.y = mouseY - (mouseY - this.appState.viewTransform.y) * zoomChange;
    this.appState.viewTransform.zoom = newZoom;
  }

  private getElementAtPoint(point: Point): ExcalidrawElement | null {
    for (let i = this.elements.length - 1; i >= 0; i--) {
      const element = this.elements[i];
      if (this.isPointInElement(point, element)) {
        return element;
      }
    }
    return null;
  }

  private isPointInElement(point: Point, element: ExcalidrawElement): boolean {
    return (
      point.x >= element.x &&
      point.x <= element.x + Math.abs(element.width) &&
      point.y >= element.y &&
      point.y <= element.y + Math.abs(element.height)
    );
  }

  private getCanvasPoint(event: PointerEvent): Point {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left - this.appState.viewTransform.x) / this.appState.viewTransform.zoom,
      y: (event.clientY - rect.top - this.appState.viewTransform.y) / this.appState.viewTransform.zoom
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  getElements(): ExcalidrawElement[] {
    return this.elements;
  }

  clearElements() {
    this.elements = [];
    this.appState.selectedElementIds = [];
    this.appState.editingElement = null;
  }
}
