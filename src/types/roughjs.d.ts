declare module 'roughjs' {
  export interface RoughOptions {
    stroke?: string;
    fill?: string;
    fillStyle?: 'hachure' | 'solid' | 'zigzag' | 'cross-hatch' | 'dots' | 'dashed' | 'zigzag-line';
    strokeWidth?: number;
    roughness?: number;
    bowing?: number;
    seed?: number;
    hachureAngle?: number;
    hachureGap?: number;
    fillWeight?: number;
  }

  export interface RoughCanvas {
    rectangle(x: number, y: number, width: number, height: number, options?: RoughOptions): void;
    ellipse(x: number, y: number, width: number, height: number, options?: RoughOptions): void;
    circle(x: number, y: number, diameter: number, options?: RoughOptions): void;
    line(x1: number, y1: number, x2: number, y2: number, options?: RoughOptions): void;
    curve(points: number[][], options?: RoughOptions): void;
    linearPath(points: number[][], options?: RoughOptions): void;
    path(pathString: string, options?: RoughOptions): void;
  }

  export interface Rough {
    canvas(canvas: HTMLCanvasElement): RoughCanvas;
  }

  const rough: Rough;
  export default rough;
}
