// src/components/Footer.tsx
interface FooterProps {
  viewTransform: { x: number; y: number; zoom: number };
  selectedCount: number;
}

export function Footer({ viewTransform, selectedCount }: FooterProps) {
  return (
    <div className="footer">
      <div>
        Zoom: {Math.round(viewTransform.zoom * 100)}%
      </div>
      <div>
        Selected: {selectedCount}
      </div>
      <div>
        Position: {Math.round(viewTransform.x)}, {Math.round(viewTransform.y)}
      </div>
    </div>
  );
}
