import { AgentSigil } from "../agent-sigil";
import { StatusGlyph } from "../status-glyph";
import { DotRail } from "./dot-rail";

export function DotRailMinimal() {
  return <DotRail value={0.62} live label="Upload progress" className="max-w-xs" />;
}

const STEPS = [
  { name: "Index repository", status: "running", value: 0.45, tone: "ink", live: true },
  { name: "Write tests", status: "done", value: 1, tone: "muted", live: false },
  { name: "Deploy preview", status: "waiting", value: 0.5, tone: "ember", live: true },
] as const;

export function DotRailFull() {
  return (
    <div className="grid w-full max-w-md grid-cols-[auto_auto_1fr_auto] items-center gap-x-3 gap-y-4 font-kura-sans text-[13px] text-kura-fg">
      {STEPS.map((step) => (
        <div key={step.name} className="col-span-4 grid grid-cols-subgrid items-center">
          <StatusGlyph status={step.status} />
          <span
            className={
              step.status === "waiting"
                ? "text-kura-ember-text"
                : step.status === "done"
                  ? "text-kura-fg-muted"
                  : undefined
            }
          >
            {step.name}
          </span>
          <DotRail value={step.value} tone={step.tone} live={step.live} label={step.name} />
          <span className="text-right font-kura-mono text-[12px] text-kura-fg-subtle tabular-nums">
            {Math.round(step.value * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}

const SPANS = [
  { name: "plan", start: 0, value: 0.18, time: "1.2s" },
  { name: "edit", start: 0.2, value: 0.36, time: "2.4s" },
  { name: "test", start: 0.58, value: 0.24, time: "1.6s", live: true },
] as const;

export function DotRailSpans() {
  return (
    <div className="grid w-full max-w-md grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2.5 font-kura-mono text-[12px] text-kura-fg-subtle tabular-nums">
      {SPANS.map((span) => (
        <div key={span.name} className="col-span-3 grid grid-cols-subgrid items-center">
          <span className="text-kura-fg-muted">{span.name}</span>
          <DotRail
            start={span.start}
            value={span.value}
            tone={"live" in span ? "ink" : "muted"}
            live={"live" in span}
          />
          <span className="text-right">{span.time}</span>
        </div>
      ))}
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
