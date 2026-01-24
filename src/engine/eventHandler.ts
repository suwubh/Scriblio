// src/engine/eventHandler.ts

import { ExcalidrawElement, AppState, Point } from '../types/excalidraw';

export class EventHandler {
  private onElementsChanged?: (elements: ExcalidrawElement[]) => void;
  private canvas: HTMLCanvasElement;
  private elements: ExcalidrawElement[] = [];
  private appState: AppState;
  private isDrawing = false;
  private isDragging = false;
  private dragOffsets: Map<string, Point> = new Map();
  private selectionRect: { start: Point; current: Point } | null = null;
  private onElementsCommitted?: (elements: ExcalidrawElement[]) => void;

  // ✅ FIX #1: Store bound handlers for proper cleanup
  private boundHandlers = {
    pointerdown: this.handlePointerDown.bind(this),
    pointermove: this.handlePointerMove.bind(this),
    pointerup: this.handlePointerUp.bind(this),
    wheel: this.handleWheel.bind(this)
  };

  constructor(canvas: HTMLCanvasElement, appState: AppState) {
    this.canvas = canvas;
    this.appState = appState;
    this.setupEventListeners();
  }

  public setOnElementsCommitted(cb: (elements: ExcalidrawElement[]) => void) {
    this.onElementsCommitted = cb;
  }

  public updateAppState(newAppState: AppState) {
    this.appState = newAppState;
  }

  public setOnElementsChanged(callback: (elements: ExcalidrawElement[]) => void) {
    this.onElementsChanged = callback;
  }

  public setElements(elements: ExcalidrawElement[]) {
    this.elements = [...elements];
    if (elements.length === 0) {
      this.appState.selectedElementIds = [];
      this.appState.editingElement = null;
    }
  }

  // ✅ FIX #1: Use bound handlers
  private setupEventListeners() {
    this.canvas.addEventListener('pointerdown', this.boundHandlers.pointerdown);
    this.canvas.addEventListener('pointermove', this.boundHandlers.pointermove);
    this.canvas.addEventListener('pointerup', this.boundHandlers.pointerup);
    this.canvas.addEventListener('wheel', this.boundHandlers.wheel, { passive: false });
  }

  // ✅ FIX #1: Add proper cleanup method
  public destroy() {
    this.canvas.removeEventListener('pointerdown', this.boundHandlers.pointerdown);
    this.canvas.removeEventListener('pointermove', this.boundHandlers.pointermove);
    this.canvas.removeEventListener('pointerup', this.boundHandlers.pointerup);
    this.canvas.removeEventListener('wheel', this.boundHandlers.wheel);
    
    // Clean up references
    this.onElementsChanged = undefined;
    this.onElementsCommitted = undefined;
    this.elements = [];
    this.dragOffsets.clear();
  }

  private commitNow() {
    if (this.onElementsCommitted) {
      const deep = JSON.parse(JSON.stringify(this.elements)) as ExcalidrawElement[];
      this.onElementsCommitted(deep);
    }
  }

  private notifyElementsChanged() {
    if (this.onElementsChanged) {
      this.onElementsChanged([...this.elements]);
    }
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
        this.handleSelectionStart(point, event);
        break;
      case 'text':
        this.startCreatingText(point);
        break;
      case 'image':
        this.startCreatingImage(point);
        break;
      case 'eraser':
        this.eraseAt(point);
        break;
      default:
        break;
    }
  }

  private handlePointerMove(event: PointerEvent) {
    if (!this.isDrawing) return;

    const point = this.getCanvasPoint(event);

    if (this.appState.activeTool === 'eraser') {
      this.eraseAt(point);
      return;
    }

    if (this.appState.activeTool === 'selection') {
      this.handleSelectionMove(point);
      return;
    }

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

    if (this.appState.activeTool === 'selection') {
      this.handleSelectionEnd();
    }

    if (this.appState.editingElement) {
      this.finalizeElement();
    }

    this.isDragging = false;
    this.dragOffsets.clear();
    this.selectionRect = null;
  }

  private handleSelectionStart(point: Point, event: PointerEvent) {
    const hitElement = this.getElementAtPoint(point);
    const isShiftPressed = event.shiftKey || event.ctrlKey || event.metaKey;

    if (hitElement) {
      if (this.appState.selectedElementIds.includes(hitElement.id)) {
        this.startDragging(point);
      } else {
        if (isShiftPressed) {
          this.appState.selectedElementIds.push(hitElement.id);
        } else {
          this.appState.selectedElementIds = [hitElement.id];
        }
        this.startDragging(point);
      }
    } else {
      if (!isShiftPressed) {
        this.appState.selectedElementIds = [];
      }
      this.selectionRect = { start: point, current: point };
    }
  }

  private handleSelectionMove(point: Point) {
    if (this.isDragging) {
      this.updateDragging(point);
    } else if (this.selectionRect) {
      this.selectionRect.current = point;
      this.updateRectangleSelection();
    }
  }

  private handleSelectionEnd() {
    if (this.isDragging) {
      this.finalizeDragging();
    }

    this.selectionRect = null;
    this.isDragging = false;
    this.dragOffsets.clear();
  }

  private startDragging(point: Point) {
    this.isDragging = true;
    this.dragOffsets.clear();

    for (const elementId of this.appState.selectedElementIds) {
      const element = this.elements.find(el => el.id === elementId);
      if (element) {
        this.dragOffsets.set(elementId, {
          x: point.x - element.x,
          y: point.y - element.y
        });
      }
    }
  }

  private updateDragging(point: Point) {
    for (const elementId of this.appState.selectedElementIds) {
      const element = this.elements.find(el => el.id === elementId);
      const offset = this.dragOffsets.get(elementId);
      if (element && offset) {
        element.x = point.x - offset.x;
        element.y = point.y - offset.y;
        element.updated = Date.now();
      }
    }
  }

  private finalizeDragging() {
    this.notifyElementsChanged();
    this.commitNow();
  }

  private updateRectangleSelection() {
    if (!this.selectionRect) return;

    const rect = this.selectionRect;
    const minX = Math.min(rect.start.x, rect.current.x);
    const maxX = Math.max(rect.start.x, rect.current.x);
    const minY = Math.min(rect.start.y, rect.current.y);
    const maxY = Math.max(rect.start.y, rect.current.y);

    const selectedIds: string[] = [];
    for (const element of this.elements) {
      const elementMinX = Math.min(element.x, element.x + element.width);
      const elementMaxX = Math.max(element.x, element.x + element.width);
      const elementMinY = Math.min(element.y, element.y + element.height);
      const elementMaxY = Math.max(element.y, element.y + element.height);

      if (elementMinX >= minX && elementMaxX <= maxX &&
          elementMinY >= minY && elementMaxY <= maxY) {
        selectedIds.push(element.id);
      }
    }

    this.appState.selectedElementIds = selectedIds;
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
    this.notifyElementsChanged();
    this.commitNow();
  }

  private startCreatingImage(point: Point) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            let width = img.width;
            let height = img.height;
            const maxSize = 300;
            if (width > maxSize || height > maxSize) {
              const ratio = Math.min(maxSize / width, maxSize / height);
              width = width * ratio;
              height = height * ratio;
            }

            const element: ExcalidrawElement = {
              id: this.generateId(),
              type: 'image',
              x: point.x,
              y: point.y,
              width: width,
              height: height,
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
              imageData: e.target?.result as string
            };

            this.elements.push(element);
            this.notifyElementsChanged();
            this.commitNow();
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
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
    element.updated = Date.now();

    if (element.points.length > 1) {
      const minX = Math.min(...element.points.map(p => p.x));
      const maxX = Math.max(...element.points.map(p => p.x));
      const minY = Math.min(...element.points.map(p => p.y));
      const maxY = Math.max(...element.points.map(p => p.y));

      element.width = Math.max(1, maxX - minX);
      element.height = Math.max(1, maxY - minY);
      element.updated = Date.now();

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

    element.updated = Date.now();
  }

  private finalizeElement() {
    if (this.appState.editingElement) {
      const element = this.appState.editingElement;

      element.updated = Date.now();

      if (element.type === 'freedraw' || element.type === 'line') {
        if (element.points && element.points.length > 1) {
          this.elements.push(element);
          this.notifyElementsChanged();
        }
      } else if (Math.abs(element.width) > 3 || Math.abs(element.height) > 3) {
        this.elements.push(element);
        this.notifyElementsChanged();
      }

      this.appState.editingElement = null;
      this.commitNow();
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

  private eraseAt(point: Point) {
    const hit = this.getElementAtPoint(point);
    if (hit) {
      this.elements = this.elements.filter(el => el.id !== hit.id);
      this.appState.selectedElementIds = this.appState.selectedElementIds.filter(id => id !== hit.id);
      this.notifyElementsChanged();
      this.commitNow();
    }
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
    const minX = Math.min(element.x, element.x + element.width);
    const maxX = Math.max(element.x, element.x + element.width);
    const minY = Math.min(element.y, element.y + element.height);
    const maxY = Math.max(element.y, element.y + element.height);

    return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
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

  getSelectionRect(): { start: Point; current: Point } | null {
    return this.selectionRect;
  }

  clearElements() {
    this.elements = [];
    this.appState.selectedElementIds = [];
    this.appState.editingElement = null;
    this.selectionRect = null;
    this.isDragging = false;
    this.dragOffsets.clear();
    this.isDrawing = false;
  }
}