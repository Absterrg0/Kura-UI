import type * as React from "react";
import { AbsoluteFill } from "remotion";

/**
 * A real component pulled out of the page and staged in space: laid out at `zoom` (CSS zoom
 * re-lays it out, so text stays crisp), then turned in perspective about its centre.
 */
export function Plane({
  children,
  width,
  zoom = 2.5,
  x = 960,
  y = 540,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
  perspective = 1600,
  origin = "50% 50%",
}: {
  children: React.ReactNode;
  /** Layout width in CSS px before zoom. */
  width: number;
  zoom?: number;
  x?: number;
  y?: number;
  z?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  perspective?: number;
  origin?: string;
}) {
  return (
    <AbsoluteFill style={{ perspective, perspectiveOrigin: "50% 50%" }}>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          transformStyle: "preserve-3d",
          transform: `translate(-50%, -50%) translate3d(0, 0, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`,
          transformOrigin: origin,
        }}
      >
        <div style={{ zoom, width }}>{children}</div>
      </div>
    </AbsoluteFill>
  );
}
