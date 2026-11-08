import { type AgentStatus, StatusGlyph } from "./status-glyph";

export function StatusGlyphMinimal() {
  return <StatusGlyph status="running" />;
}

const STATES: AgentStatus[] = [
  "queued",
  "running",
  "waiting",
  "done",
  "failed",
  "skipped",
  "paused",
];

export function StatusGlyphFull() {
  return (
    <div className="grid grid-cols-[auto_repeat(3,auto)] items-center gap-x-6 gap-y-3 text-[13px]">
      {STATES.map((s) => (
        <div key={s} className="contents">
          <span className="text-kura-fg-muted capitalize">{s}</span>
          <StatusGlyph status={s} size="sm" />
          <StatusGlyph status={s} />
          <StatusGlyph status={s} size="lg" />
        </div>
      ))}
    </div>
  );
}
