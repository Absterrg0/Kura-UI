import { AgentSigil } from "../agent-sigil";
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

const CREW: { name: string; doing: string; status: AgentStatus }[] = [
  { name: "explorer", doing: "Found 23 calls to fetchUser()", status: "done" },
  { name: "test-writer", doing: "Adding a fixture for expired sessions", status: "running" },
  { name: "migrator", doing: "Waiting for your approval", status: "waiting" },
];

export function StatusGlyphComposition() {
  return (
    <ul className="flex w-full max-w-xs flex-col gap-3 font-kura-sans text-[13px] text-kura-fg">
      {CREW.map((a) => (
        <li key={a.name} className="flex items-center gap-3">
          <AgentSigil name={a.name} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="font-medium">{a.name}</span>
            <span className="truncate text-[12.5px] text-kura-fg-subtle">{a.doing}</span>
          </span>
          <StatusGlyph status={a.status} />
        </li>
      ))}
    </ul>
  );
}
