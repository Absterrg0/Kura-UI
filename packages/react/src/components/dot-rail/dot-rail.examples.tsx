import { AgentSigil } from "../agent-sigil";
import { StatusGlyph } from "../status-glyph";
import { DotRail } from "./dot-rail";

export function DotRailMinimal() {
  return <DotRail value={0.62} label="Upload progress" className="max-w-xs" />;
}

export function DotRailFull() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4 font-kura-sans text-[12.5px] text-kura-fg-muted">
      <div className="flex flex-col gap-2">
        Running
        <DotRail value={0.45} live label="Running" />
      </div>
      <div className="flex flex-col gap-2">
        Finished
        <DotRail value={1} tone="muted" label="Finished" />
      </div>
      <div className="flex flex-col gap-2">
        Waiting on you
        <DotRail value={0.5} tone="ember" live label="Waiting on you" />
      </div>
      <div className="flex flex-col gap-2">
        Spans on one axis
        <DotRail start={0} value={0.2} tone="muted" />
        <DotRail start={0.22} value={0.35} tone="muted" />
        <DotRail start={0.58} value={0.24} live />
      </div>
    </div>
  );
}

export function DotRailComposition() {
  return (
    <div className="grid w-full max-w-sm grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 font-kura-sans text-[13px] text-kura-fg">
      <AgentSigil name="test-writer" className="row-span-2" />
      <span className="font-medium">test-writer</span>
      <span className="flex items-center gap-2 font-kura-mono text-[12px] text-kura-fg-subtle tabular-nums">
        1:35
        <StatusGlyph status="running" />
      </span>
      <span className="col-span-2 text-[12.5px] text-kura-fg-subtle">
        Adding a fixture for expired sessions
      </span>
      <DotRail
        value={0.62}
        live
        label="test-writer progress"
        className="col-span-2 col-start-2 mt-1"
      />
    </div>
  );
}
