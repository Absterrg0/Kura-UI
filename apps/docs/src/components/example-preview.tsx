"use client";

import { IconButton } from "@kura-ui/react/icon-button";
import { RotateCcw } from "lucide-react";
import * as React from "react";
import { examples } from "@/generated/examples";
import { cn } from "@/lib/cn";

class Boundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  override state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  override render() {
    if (this.state.error) {
      return (
        <p className="font-kura-mono text-kura-danger-text text-xs">
          Preview crashed: {this.state.error.message}
        </p>
      );
    }
    return this.props.children;
  }
}

/** Renders a live example by slug + export name (from the generated examples index). */
export function ExamplePreview({
  slug,
  name,
  className,
  replay = true,
  compact = false,
  dots = false,
}: {
  slug: string;
  name: string;
  className?: string;
  replay?: boolean;
  compact?: boolean;
  /** Draw the dot-grid stage. */
  dots?: boolean;
}) {
  const [key, setKey] = React.useState(0);
  const Example = examples[slug]?.[name];
  return (
    <div
      data-slot="example-preview"
      data-example={`${slug}/${name}`}
      className={cn(
        "live-gloss relative flex items-center justify-center overflow-hidden",
        dots && "bg-dots",
        compact ? "min-h-40 p-6" : "min-h-80 px-5 py-12 md:p-12",
        className,
      )}
    >
      {replay && !compact && (
        <IconButton
          label="Replay"
          size="xs"
          icon={<RotateCcw />}
          className="absolute top-2 right-2 text-kura-fg-subtle"
          onClick={() => setKey((k) => k + 1)}
        />
      )}
      <Boundary key={key}>
        {Example ? (
          <Example />
        ) : (
          <p className="text-kura-fg-subtle text-sm">Missing example {name}</p>
        )}
      </Boundary>
    </div>
  );
}
