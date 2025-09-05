export interface Point {
  x: number;
  y: number;
}

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

// Simplified AppState for initial implementation
export interface AppState {
  viewTransform: {
    x: number;
    y: number;
    zoom: number;
  };
  selectedElementIds: string[];
  editingElement: ExcalidrawElement | null;
  draggingElement: ExcalidrawElement | null;
  tool: "selection" | "rectangle" | "ellipse" | "diamond" | "arrow" | "line" | "freedraw" | "text" | "image" | "eraser";
  isResizing: boolean;
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
}
