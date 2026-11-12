"use client";

import * as React from "react";
import { Button } from "../button";
import { StatusGlyph } from "../status-glyph";
import { Halftone } from "./halftone";

const sheet =
  "relative isolate overflow-hidden rounded-kura-xl bg-kura-surface font-kura-sans text-kura-fg shadow-kura-sm";

export function HalftoneMinimal() {
  return (
    <div className={`${sheet} h-32 w-full max-w-sm p-4`}>
      <Halftone />
      <p className="font-medium text-[13px] text-kura-ember-text">Needs you</p>
    </div>
  );
}

export function HalftoneFull() {
  const [visible, setVisible] = React.useState(true);
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className={`${sheet} h-24`}>
          <Halftone visible={visible} />
        </div>
        <div className={`${sheet} h-24`}>
          <Halftone corner="bottom-left" visible={visible} />
        </div>
        <div className={`${sheet} h-24`}>
          <Halftone tone="ink" reach={0.9} />
        </div>
        <div className={`${sheet} h-24`}>
          <Halftone corner="top-left" reach={0.4} visible={visible} />
        </div>
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="self-start"
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? "Decide" : "Ask again"}
      </Button>
    </div>
  );
}

export function HalftoneComposition() {
  const [waiting, setWaiting] = React.useState(true);
  return (
    <div className={`${sheet} flex w-full max-w-sm flex-col gap-3 p-4`}>
      <Halftone visible={waiting} />
      <p
        className={`flex items-center gap-2 font-medium text-[12.5px] ${waiting ? "text-kura-ember-text" : "text-kura-fg-muted"}`}
      >
        <StatusGlyph status={waiting ? "waiting" : "running"} label={null} />
        {waiting ? "Needs you" : "Running"}
      </p>
      <p className="max-w-[20ch] font-semibold text-[16px] leading-snug tracking-[-0.016em]">
        Deploy the preview to staging
      </p>
      <div className="flex justify-end gap-2">
        {waiting ? (
          <Button size="sm" onClick={() => setWaiting(false)}>
            Deploy
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setWaiting(true)}>
            Ask again
          </Button>
        )}
      </div>
    </div>
  );
}
