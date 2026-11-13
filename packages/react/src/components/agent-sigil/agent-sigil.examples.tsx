import { StatusGlyph } from "../status-glyph";
import { AgentSigil } from "./agent-sigil";

export function AgentSigilMinimal() {
  return (
    <span className="flex items-center gap-2.5 font-kura-sans font-medium text-[13px] text-kura-fg">
      <AgentSigil name="explorer" />
      explorer
    </span>
  );
}

const TEAM = ["explorer", "test-writer", "reviewer", "migrator"];

export function AgentSigilFull() {
  return (
    <div className="flex flex-col gap-4 font-kura-sans text-[13px] text-kura-fg">
      <div className="flex items-center gap-3">
        <AgentSigil name="planner" size="lg" />
        <div className="flex flex-col">
          <span className="font-semibold">planner</span>
          <span className="text-[12.5px] text-kura-fg-subtle">Leads four agents</span>
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-x-8 gap-y-2.5 pl-[52px]">
        {TEAM.map((name) => (
          <li key={name} className="flex items-center gap-2 text-[12.5px] text-kura-fg-muted">
            <AgentSigil name={name} size="sm" />
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AgentSigilComposition() {
  return (
    <div className="flex w-full max-w-xs items-center gap-3 font-kura-sans text-[13px] text-kura-fg">
      <AgentSigil name="migrator" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-medium">migrator</span>
        <span className="truncate text-[12.5px] text-kura-fg-subtle">
          Waiting for your approval
        </span>
      </span>
      <StatusGlyph status="waiting" />
    </div>
  );
}
