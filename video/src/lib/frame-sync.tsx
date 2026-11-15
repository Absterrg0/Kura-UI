import * as React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

/**
 * The library's loops (the chase round a running glyph, the blink of a waiting centre, the pulse
 * of a live dot) are CSS animations on the browser's own clock. Every frame, pause them all and
 * seek each to the film's time, so they land in the same place in every render.
 */
export function FrameSync() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  React.useLayoutEffect(() => {
    const ms = (frame / fps) * 1000;
    for (const a of document.getAnimations()) {
      a.pause();
      a.currentTime = ms;
    }
  });
  return null;
}
