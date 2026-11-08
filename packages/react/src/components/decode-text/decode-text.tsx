"use client";

import * as React from "react";
import { useReducedMotion } from "../../hooks/use-reduced-motion";
import { cn } from "../../lib/cn";
import { mergeRefs } from "../../lib/merge-refs";

export type DecodeTextStartOn = "mount" | "view";

export interface DecodeTextProps extends Omit<React.ComponentProps<"span">, "children"> {
  /** The final text. Plain string only. */
  children: string;
  /** When the first reveal runs: on mount, or the first time it scrolls into view. Default "mount". */
  startOn?: DecodeTextStartOn;
  /** Replay the reveal whenever this value changes (a counter, an id, a boolean…). */
  trigger?: string | number | boolean;
  /** Milliseconds for the reveal to sweep the whole text. Default 1000. */
  duration?: number;
  /** How many characters ahead of the resolved edge actively scramble (in accent). Default 6. */
  spread?: number;
  /** Characters used for the scramble. Default: A–Z, 0–9 and a few symbols. */
  glyphs?: string;
  /** Element to render. Default "span". */
  as?: "span" | "p" | "div" | "h1" | "h2" | "h3" | "code";
  /** Called when a reveal finishes. */
  onComplete?: () => void;
}

type Phase = "pending" | "running" | "done";

const DEFAULT_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>";

const easeOut = (t: number) => 1 - (1 - t) ** 2;

/**
 * A text reveal that scrambles glyphs and resolves them left to right, like an AI decoding a
 * message. Every glyph slot reserves the width of its final character, so proportional fonts do
 * not jitter (monospace fonts look best). Screen readers get the final text immediately; the
 * animation is aria-hidden. Runs on mount, on first view, or when `trigger` changes.
 */
export function DecodeText({
  children: text,
  startOn = "mount",
  trigger,
  duration = 1000,
  spread = 6,
  glyphs = DEFAULT_GLYPHS,
  as = "span",
  onComplete,
  className,
  ref,
  ...props
}: DecodeTextProps) {
  const reducedMotion = useReducedMotion();
  const rootRef = React.useRef<HTMLElement>(null);
  const charRefs = React.useRef<Array<HTMLSpanElement | null>>([]);
  const [phase, setPhase] = React.useState<Phase>("pending");
  const seen = React.useRef(startOn === "mount");
  const live = React.useRef({ duration, spread, glyphs, onComplete });
  live.current = { duration, spread, glyphs, onComplete };

  const words = React.useMemo(() => text.split(/(\s+)/), [text]);

  const scrambleAll = React.useCallback(() => {
    const g = live.current.glyphs || DEFAULT_GLYPHS;
    for (const el of charRefs.current) {
      if (!el) continue;
      el.textContent = g[Math.floor(Math.random() * g.length)] ?? "";
      el.dataset.state = "pending";
    }
  }, []);

  // Decide what to do whenever the text or trigger changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: replay on text/trigger changes only.
  React.useLayoutEffect(() => {
    if (reducedMotion) {
      setPhase("done");
      return;
    }
    if (seen.current) {
      setPhase("running");
      return;
    }
    setPhase("pending");
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      seen.current = true;
      setPhase("running");
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        seen.current = true;
        setPhase("running");
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [text, trigger, reducedMotion]);

  // Pending: show a still scramble so the slot is not empty while waiting to be seen.
  React.useLayoutEffect(() => {
    if (phase === "pending") scrambleAll();
  }, [phase, scrambleAll]);

  // Running: drive the glyphs imperatively (no React re-render per frame).
  // biome-ignore lint/correctness/useExhaustiveDependencies: restarts per run; reads live props.
  React.useLayoutEffect(() => {
    if (phase !== "running") return;
    const els = charRefs.current.filter((e): e is HTMLSpanElement => !!e);
    const finals = els.map((e) => e.dataset.char ?? "");
    const n = els.length;
    scrambleAll();
    const start = performance.now();
    const lastSwap = new Float64Array(n);
    let raf = 0;
    const frame = (now: number) => {
      const { duration: d, spread: s, glyphs: gl } = live.current;
      const g = gl || DEFAULT_GLYPHS;
      const t = Math.min(1, (now - start) / Math.max(1, d));
      const front = easeOut(t) * (n + s);
      for (let k = 0; k < n; k++) {
        const el = els[k]!;
        if (front >= k + s || t >= 1) {
          if (el.dataset.state !== "done") {
            el.textContent = finals[k]!;
            el.dataset.state = "done";
          }
          continue;
        }
        const active = front >= k;
        const every = active ? 45 : 140;
        if (now - lastSwap[k]! > every) {
          lastSwap[k] = now;
          el.textContent = g[Math.floor(Math.random() * g.length)] ?? "";
        }
        el.dataset.state = active ? "active" : "pending";
      }
      if (t < 1) raf = requestAnimationFrame(frame);
      else {
        setPhase("done");
        live.current.onComplete?.();
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [phase, text, trigger]);

  const Comp = as as "span";
  charRefs.current = [];
  let index = 0;

  return (
    <Comp
      ref={mergeRefs(rootRef as React.Ref<HTMLSpanElement>, ref)}
      data-slot="decode-text"
      data-state={phase}
      className={cn("tabular-nums", className)}
      {...props}
    >
      <span className="sr-only">{text}</span>
      {phase === "done" ? (
        <span aria-hidden data-slot="decode-text-glyphs">
          {text}
        </span>
      ) : (
        <span aria-hidden data-slot="decode-text-glyphs">
          {words.map((word, w) =>
            /^\s+$/.test(word) || word === "" ? (
              word
            ) : (
              <span key={w} className="inline-block whitespace-nowrap">
                {Array.from(word).map((ch, c) => {
                  const i = index++;
                  return (
                    <span key={c} className="inline-grid">
                      <span className="invisible col-start-1 row-start-1">{ch}</span>
                      <span
                        ref={(el) => {
                          charRefs.current[i] = el;
                        }}
                        data-slot="decode-text-char"
                        data-char={ch}
                        data-state="pending"
                        className="col-start-1 row-start-1 overflow-visible text-center transition-colors duration-(--kura-duration-fast) data-[state=active]:text-kura-accent-text data-[state=pending]:text-kura-fg-subtle data-[state=pending]:opacity-50"
                      >
                        {ch}
                      </span>
                    </span>
                  );
                })}
              </span>
            ),
          )}
        </span>
      )}
    </Comp>
  );
}
