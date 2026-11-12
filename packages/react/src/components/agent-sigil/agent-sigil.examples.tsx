import { StatusGlyph } from "../status-glyph";
import { AgentSigil } from "./agent-sigil";

export function AgentSigilMinimal() {
  return <AgentSigil name="Kura" label="Kura" />;
}

const TEAM = ["explorer", "test-writer", "reviewer", "migrator", "planner", "deployer"];

export function AgentSigilFull() {
  return (
    <div className="flex flex-col gap-5 font-kura-sans text-[12.5px] text-kura-fg-muted">
      <div className="flex items-center gap-3">
        <AgentSigil name="Kura" size="sm" />
        <AgentSigil name="Kura" />
        <AgentSigil name="Kura" size="lg" />
        <AgentSigil name="Kura" size="lg" bare />
      </div>
      <ul className="grid grid-cols-3 gap-x-4 gap-y-3">
        {TEAM.map((name) => (
          <li key={name} className="flex items-center gap-2 whitespace-nowrap">
            <AgentSigil name={name} />
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
