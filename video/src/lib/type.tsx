import type * as React from "react";
import { useCurrentFrame } from "remotion";
import { settle, stagger, tween } from "./anim";

/**
 * A headline that rises in word by word from behind its own baseline (a mask, never a blur),
 * holds, and leaves as one piece. Geist 600 at −0.045em: the site hero's setting.
 */
export function Headline({
  text,
  at,
  out,
  size = 104,
  className,
  style,
  muted,
}: {
  text: string;
  /** Frame the first word starts to rise. */
  at: number;
  /** Frame the line starts to leave (omit to stay). */
  out?: number;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Words (by index) drawn in ink-2. */
  muted?: number[];
}) {
  const frame = useCurrentFrame();
  const lines = text.split("\n").map((l) => l.split(" "));
  let index = 0;
  const leave = out == null ? 0 : tween(frame, out, out + 14);
  if (frame < at - 1 || (out != null && frame > out + 16)) return null;
  return (
    <div
      className={className}
      style={{
        fontSize: size,
        lineHeight: 1.02,
        letterSpacing: "-0.045em",
        fontWeight: 600,
        color: "var(--kura-fg)",
        opacity: 1 - leave,
        transform: `translateY(${-14 * leave}px)`,
        ...style,
      }}
    >
      {lines.map((words, li) => (
        <div key={li} style={{ whiteSpace: "nowrap" }}>
          {words.map((w, wi) => {
            const i = index++;
            const s = settle(frame, at + stagger(i), 140);
            const o = tween(frame, at + stagger(i), at + stagger(i) + 10);
            return (
              <span
                key={wi}
                style={{
                  display: "inline-block",
                  overflow: "hidden",
                  verticalAlign: "top",
                  paddingBottom: "0.14em",
                  marginBottom: "-0.14em",
                  paddingRight: "0.06em",
                  marginRight: wi < words.length - 1 ? "0.2em" : 0,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    transform: `translateY(${(1 - s) * 105}%)`,
                    opacity: o,
                    color: muted?.includes(i) ? "var(--kura-fg-muted)" : undefined,
                  }}
                >
                  {w}
                </span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
