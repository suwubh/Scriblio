// src/engine/renderer.ts

import rough from 'roughjs';
import { ExcalidrawElement, AppState } from '../types/excalidraw';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private roughCanvas: any;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.roughCanvas = rough.canvas(canvas);
  }

  render(elements: ExcalidrawElement[], appState: AppState) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.save();
    this.ctx.translate(appState.viewTransform.x, appState.viewTransform.y);
    this.ctx.scale(appState.viewTransform.zoom, appState.viewTransform.zoom);

    elements.forEach(element => {
      this.renderElement(element, appState.selectedElementIds.includes(element.id));
    });

    this.ctx.restore();
  }

  private renderElement(element: ExcalidrawElement, isSelected: boolean) {
    const options = {
      stroke: element.strokeColor,
      fill: element.backgroundColor === 'transparent' ? undefined : element.backgroundColor,
      strokeWidth: element.strokeWidth,
      roughness: element.roughness,
      seed: element.seed,
      fillStyle: element.fillStyle
    };

    this.ctx.save();
    this.ctx.translate(element.x, element.y);
    this.ctx.rotate(element.angle);
    this.ctx.globalAlpha = element.opacity;

    switch (element.type) {
      case 'rectangle':
        this.roughCanvas.rectangle(0, 0, element.width, element.height, options);
        break;

      case 'ellipse':
        this.roughCanvas.ellipse(
          element.width / 2,
          element.height / 2,
          element.width,
          element.height,
          options
        );
        break;

      case 'diamond':
        this.renderDiamond(element, options);
        break;

      case 'arrow':
        this.renderArrow(element, options);
        break;

      case 'line':
        if (element.points && element.points.length >= 2) {
          this.roughCanvas.linearPath(element.points.map(p => [p.x, p.y]), options);
        }
        break;

      case 'freedraw':
        this.renderFreehand(element, options);
        break;

      case 'text':
        this.renderText(element);
        break;
    }

    if (isSelected) {
      this.renderSelectionOutline(element);
    }

    this.ctx.restore();
  }

  private renderDiamond(element: ExcalidrawElement, options: any) {
    const path = [
      [element.width / 2, 0],
      [element.width, element.height / 2],
      [element.width / 2, element.height],
      [0, element.height / 2],
      [element.width / 2, 0]
    ];
    this.roughCanvas.linearPath(path, options);
  }

  private renderArrow(element: ExcalidrawElement, options: any) {
    const startX = 0;
    const startY = 0;
    const endX = element.width;
    const endY = element.height;

    // Draw main line
    this.roughCanvas.line(startX, startY, endX, endY, options);

    // Draw arrowhead
    const angle = Math.atan2(endY - startY, endX - startX);
    const arrowLength = 20;
    const arrowAngle = Math.PI / 6;

    const arrowHead1X = endX - arrowLength * Math.cos(angle - arrowAngle);
    const arrowHead1Y = endY - arrowLength * Math.sin(angle - arrowAngle);
    const arrowHead2X = endX - arrowLength * Math.cos(angle + arrowAngle);
    const arrowHead2Y = endY - arrowLength * Math.sin(angle + arrowAngle);

    this.roughCanvas.line(endX, endY, arrowHead1X, arrowHead1Y, options);
    this.roughCanvas.line(endX, endY, arrowHead2X, arrowHead2Y, options);
  }

  private renderFreehand(element: ExcalidrawElement, options: any) {
    if (element.points && element.points.length > 1) {
      this.roughCanvas.curve(element.points.map(p => [p.x, p.y]), options);
    }
  }

  private renderText(element: ExcalidrawElement) {
    if (element.text) {
      this.ctx.font = `${element.fontSize || 20}px ${element.fontFamily || 'Virgil'}`;
      this.ctx.fillStyle = element.strokeColor;
      this.ctx.textBaseline = 'top';
      this.ctx.textAlign = element.textAlign || 'left';
      this.ctx.fillText(element.text, 0, 0);
    }
  }

  private renderSelectionOutline(element: ExcalidrawElement) {
    this.ctx.strokeStyle = '#6965db';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([8, 4]);
    this.ctx.strokeRect(-4, -4, element.width + 8, element.height + 8);
    this.ctx.setLineDash([]);
  }
}
