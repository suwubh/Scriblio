// src/types/excalidraw.ts
export interface Point {
  x: number;
  y: number;
}

export type ToolType =
  | 'selection'
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'arrow'
  | 'line'
  | 'freedraw'
  | 'text'
  | 'image'
  | 'eraser';

export interface ExcalidrawElement {
  id: string;
  type: "rectangle" | "ellipse" | "diamond" | "arrow" | "line" | "freedraw" | "text" | "image";
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: "hachure" | "cross-hatch" | "solid" | "zigzag" | "dots";
  strokeWidth: number;
  strokeStyle: "solid" | "dashed" | "dotted";
  roughness: number;
  opacity: number;
  points?: Point[];
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  seed: number;
  versionNonce: number;
  isDeleted: boolean;
  groupIds: string[];
  frameId?: string;
  roundness?: { type: "round" | "sharp"; value?: number };
  boundElements?: { id: string; type: "arrow" | "text" }[];
  updated: number;
  link?: string;
  locked?: boolean;
}

export interface AppState {
  viewTransform: {
    x: number;
    y: number;
    zoom: number;
  };
  selectedElementIds: string[];
  activeTool: ToolType;
  isToolLocked: boolean;
  editingElement: ExcalidrawElement | null;
  draggingElement: ExcalidrawElement | null;
  resizingElement: ExcalidrawElement | null;
  multiElement: ExcalidrawElement | null;
  currentItemStrokeColor: string;
  currentItemBackgroundColor: string;
  currentItemFillStyle: "hachure" | "cross-hatch" | "solid" | "zigzag" | "dots";
  currentItemStrokeWidth: number;
  currentItemStrokeStyle: "solid" | "dashed" | "dotted";
  currentItemRoughness: number;
  currentItemOpacity: number;
  currentItemFontFamily: string;
  currentItemFontSize: number;
  currentItemTextAlign: "left" | "center" | "right";
  currentItemStartArrowhead: string | null;
  currentItemEndArrowhead: string | null;
  isResizing: boolean;
  isRotating: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  zenModeEnabled: boolean;
  theme: "light" | "dark";
  exportBackground: boolean;
  exportWithDarkMode: boolean;
  width: number;
  height: number;
}
