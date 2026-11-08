"use client";

import * as React from "react";
import { KbdShortcut } from "./kbd-shortcut";

export function KbdShortcutMinimal() {
  return <KbdShortcut keys={["mod", "enter"]} label="Send" />;
}

export function KbdShortcutFull() {
  const [count, setCount] = React.useState(0);
  return (
    <div className="flex flex-col items-center gap-3">
      <KbdShortcut
        keys={["mod", "j"]}
        label="Toggle panel"
        size="md"
        variant="raised"
        allowInInputs
        enabled
        onTrigger={() => setCount((c) => c + 1)}
      />
      <p className="text-kura-fg-muted text-xs tabular-nums" aria-live="polite">
        Triggered {count} {count === 1 ? "time" : "times"}
      </p>
    </div>
  );
}

export function KbdShortcutComposerHints() {
  return (
    <div className="flex w-full max-w-md items-center justify-between rounded-kura-lg bg-kura-surface px-3 py-2 shadow-kura-sm">
      <div className="flex items-center gap-3">
        <KbdShortcut keys={["/"]} label="Commands" variant="ghost" />
        <KbdShortcut keys={["@"]} label="Context" variant="ghost" />
      </div>
      <KbdShortcut keys={["mod", "enter"]} label="Send" />
    </div>
  );
}
