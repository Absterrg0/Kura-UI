"use client";

import * as React from "react";
import { Button } from "../button";
import { StatusGlyph } from "../status-glyph";
import { ShimmerText } from "./shimmer-text";

export function ShimmerTextMinimal() {
  return <ShimmerText>Thinking…</ShimmerText>;
}

export function ShimmerTextFull() {
  const [active, setActive] = React.useState(true);
  return (
    <div className="flex flex-col items-center gap-4">
      <ShimmerText as="p" active={active} duration={2.4} spread={24} className="text-lg">
        {active ? "Searching 24 sources…" : "Searched 24 sources"}
      </ShimmerText>
      <Button variant="secondary" size="sm" onClick={() => setActive((a) => !a)}>
        {active ? "Finish" : "Restart"}
      </Button>
    </div>
  );
}

export function ShimmerTextInToolStep() {
  const [done, setDone] = React.useState(false);
  React.useEffect(() => {
    const id = setTimeout(() => setDone(true), 3200);
    return () => clearTimeout(id);
  }, []);
  return (
    <div className="flex w-72 items-center gap-2.5 rounded-kura-lg bg-kura-surface px-3 py-2.5 text-sm shadow-kura-sm">
      <StatusGlyph status={done ? "done" : "running"} label={null} />
      <span role="status" aria-live="polite">
        <ShimmerText active={!done}>
          {done ? "Read package.json" : "Reading package.json…"}
        </ShimmerText>
      </span>
    </div>
  );
}
