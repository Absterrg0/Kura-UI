"use client";

import * as React from "react";
import { ControlRoom } from "./control-room";

/** The hero window plus the switch that names every component in it. */
export function Hero() {
  const [reveal, setReveal] = React.useState(false);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4 px-1 text-[13px] text-kura-fg-muted">
        <span>One agent run, built entirely from Kura components.</span>
        <label className="inline-flex cursor-pointer select-none items-center gap-2.5">
          <span>Show component names</span>
          <button
            type="button"
            role="switch"
            aria-checked={reveal}
            onClick={() => setReveal((r) => !r)}
            className="relative h-5 w-9 shrink-0 cursor-pointer rounded-full bg-kura-active outline-none transition-colors duration-150 focus-visible:shadow-kura-focus aria-checked:bg-kura-accent"
          >
            <span
              aria-hidden
              className="absolute top-0.5 left-0.5 size-4 rounded-full bg-kura-surface shadow-kura-sm transition-transform duration-150 ease-kura-out [[aria-checked=true]>&]:translate-x-4"
            />
          </button>
        </label>
      </div>
      <ControlRoom reveal={reveal} />
    </div>
  );
}
