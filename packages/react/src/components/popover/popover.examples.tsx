"use client";

import { Settings2 } from "lucide-react";
import * as React from "react";
import { Button } from "../button";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "./popover";

export function PopoverMinimal() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary">Open</Button>
      </PopoverTrigger>
      <PopoverContent aria-label="About">Popovers hold small, interactive panels.</PopoverContent>
    </Popover>
  );
}

export function PopoverFull() {
  const [open, setOpen] = React.useState(false);
  const [temperature, setTemperature] = React.useState(0.7);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary">
          <Settings2 /> Generation settings
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        aria-labelledby="gen-settings-title"
        className="w-64"
      >
        <div className="flex flex-col gap-3">
          <h3 id="gen-settings-title" className="font-medium text-sm">
            Generation
          </h3>
          <label className="flex flex-col gap-1.5 text-kura-fg-muted text-xs">
            <span className="flex justify-between">
              Temperature{" "}
              <span className="text-kura-fg tabular-nums">{temperature.toFixed(1)}</span>
            </span>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="accent-kura-accent"
            />
          </label>
          <PopoverClose asChild>
            <Button size="sm">Done</Button>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  );
}
