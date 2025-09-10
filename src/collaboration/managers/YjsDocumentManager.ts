import * as Y from 'yjs'
import { DrawingStroke, CanvasElement } from '../types/collaboration.types'

export class YjsDocumentManager {
  public doc: Y.Doc
  public canvasMap: Y.Map<any>
  public strokesArray: Y.Array<DrawingStroke>
  public elementsMap: Y.Map<CanvasElement>

  constructor(roomId: string) {
    this.doc = new Y.Doc()
    this.canvasMap = this.doc.getMap(`canvas-${roomId}`)
    this.strokesArray = this.doc.getArray(`strokes-${roomId}`)
    this.elementsMap = this.doc.getMap(`elements-${roomId}`)
  }

  addStroke(stroke: DrawingStroke): void {
    this.strokesArray.push([stroke])
  }

  addElement(element: CanvasElement): void {
    this.elementsMap.set(element.id, element)
  }

  updateElement(elementId: string, updates: Partial<CanvasElement>): void {
    const element = this.elementsMap.get(elementId)
    if (element) {
      this.elementsMap.set(elementId, { ...element, ...updates })
    }
  }

  removeElement(elementId: string): void {
    this.elementsMap.delete(elementId)
  }

  getStrokes(): DrawingStroke[] {
    return this.strokesArray.toArray()
  }

  getElements(): CanvasElement[] {
    return Array.from(this.elementsMap.values())
  }

  setCanvasProperty(key: string, value: any): void {
    this.canvasMap.set(key, value)
  }

  getCanvasProperty(key: string): any {
    return this.canvasMap.get(key)
  }

  onStrokesChange(callback: () => void): () => void {
    this.strokesArray.observe(callback)
    return () => this.strokesArray.unobserve(callback)
  }

  onElementsChange(callback: () => void): () => void {
    this.elementsMap.observe(callback)
    return () => this.elementsMap.unobserve(callback)
  }

  onCanvasChange(callback: () => void): () => void {
    this.canvasMap.observe(callback)
    return () => this.canvasMap.unobserve(callback)
  }

  destroy(): void {
    this.doc.destroy()
  }
}
