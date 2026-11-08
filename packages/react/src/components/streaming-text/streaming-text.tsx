"use client";

import type * as React from "react";
import { cn } from "../../lib/cn";
import { type UseStreamingTextOptions, useStreamingText } from "./use-streaming-text";

export interface StreamingTextProps
  extends Omit<React.ComponentProps<"div">, "children">,
    UseStreamingTextOptions {
  /** How each newly revealed word group enters. `blur` = fade + 2px blur (default). */
  animation?: "blur" | "fade" | "none";
  /** Show the caret while streaming. It fades out when the stream completes. Default true. */
  caret?: boolean;
}

const enter = {
  blur: "transition-[opacity,filter] duration-(--kura-duration-slower) ease-kura-out starting:opacity-0 starting:[filter:blur(3px)] motion-reduce:starting:[filter:none]",
  fade: "transition-opacity duration-(--kura-duration-slow) ease-kura-out starting:opacity-0",
  none: "",
} as const;

/**
 * Renders model output that arrives token by token. Bursty input is buffered into an even
 * cadence, new word groups fade (and un-blur) in, and a soft caret marks the live edge. Accepts a
 * growing string (`text`) or an async iterable (`stream`). Never reflows earlier text.
 */
export function StreamingText({
  text,
  stream,
  speed,
  streaming,
  onComplete,
  animation = "blur",
  caret = true,
  className,
  ...props
}: StreamingTextProps) {
  const { settled, chunks, isStreaming } = useStreamingText({
    text,
    stream,
    speed,
    streaming,
    onComplete,
  });
  return (
    <div
      data-slot="streaming-text"
      data-status={isStreaming ? "streaming" : "done"}
      aria-busy={isStreaming || undefined}
      className={cn(
        "whitespace-pre-wrap break-words font-kura-sans text-[15px] text-kura-fg leading-relaxed",
        className,
      )}
      {...props}
    >
      {settled}
      {chunks.map((chunk) => (
        <span key={chunk.id} data-slot="streaming-text-chunk" className={enter[animation]}>
          {chunk.text}
        </span>
      ))}
      {caret && (
        <span
          aria-hidden
          data-slot="streaming-text-caret"
          data-visible={isStreaming}
          className={cn(
            "ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.17em] rounded-full bg-kura-accent",
            "transition-opacity duration-(--kura-duration-slow) ease-kura-out",
            "data-[visible=true]:animate-kura-pulse data-[visible=false]:opacity-0 motion-reduce:animate-none",
          )}
        />
      )}
    </div>
  );
}
