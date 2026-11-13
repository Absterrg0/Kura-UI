"use client";

import * as React from "react";
import { AgentSigil } from "../agent-sigil";
import { Button } from "../button";
import { StatusGlyph } from "../status-glyph";
import { Halftone } from "./halftone";

const sheet =
  "relative isolate overflow-hidden rounded-kura-xl bg-kura-surface font-kura-sans text-kura-fg shadow-kura-surface";

export function HalftoneMinimal() {
  return (
    <div className={`${sheet} flex w-full max-w-sm flex-col gap-2 p-4`}>
      <Halftone />
      <p className="flex items-center gap-2 font-medium text-[12.5px] text-kura-ember-text">
        <StatusGlyph status="waiting" label={null} />
        Needs you
      </p>
      <p className="max-w-[22ch] font-semibold text-[15px] leading-snug tracking-[-0.012em]">
        Approve the database migration
      </p>
    </div>
  );
}

export function HalftoneFull() {
  const [decision, setDecision] = React.useState<"pending" | "deployed" | "denied">("pending");
  const pending = decision === "pending";
  return (
    <div className={`${sheet} flex w-full max-w-sm flex-col gap-3 p-4`}>
      <Halftone visible={pending} />
      <p
        className={`flex items-center gap-2 font-medium text-[12.5px] ${pending ? "text-kura-ember-text" : "text-kura-fg-muted"}`}
      >
        <StatusGlyph
          status={pending ? "waiting" : decision === "deployed" ? "running" : "skipped"}
          label={null}
        />
        {pending ? "Needs you" : decision === "deployed" ? "Deploying" : "Denied"}
      </p>
      <p className="max-w-[20ch] font-semibold text-[16px] leading-snug tracking-[-0.016em]">
        Deploy the preview to staging
      </p>
      <div className="flex justify-end gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={!pending}
          onClick={() => setDecision("denied")}
        >
          Deny
        </Button>
        <Button
          size="sm"
          disabled={!pending}
          data-agent-confirm="Deploy the preview to staging"
          onClick={() => setDecision("deployed")}
        >
          Deploy
        </Button>
      </div>
    </div>
  );
}

const AGENTS = [
  { name: "explorer", task: "Map the auth module" },
  { name: "migrator", task: "Rename a column", asks: "Approve the migration" },
] as const;

export function HalftoneComposition() {
  const [waiting, setWaiting] = React.useState(true);
  // Two agents, one blocked on you: only that one carries the light.
  return (
    <div className="grid w-full max-w-lg grid-cols-2 gap-3">
      {AGENTS.map((agent) => {
        const needsYou = "asks" in agent && waiting;
        return (
          <div key={agent.name} className={`${sheet} flex flex-col gap-2.5 p-4`}>
            {"asks" in agent ? <Halftone visible={waiting} reach={0.42} /> : null}
            <p className="flex items-center gap-2 font-medium text-[12.5px] text-kura-fg-muted">
              <AgentSigil name={agent.name} size="sm" />
              {agent.name}
            </p>
            <p className="font-semibold text-[14px] leading-snug tracking-[-0.01em]">
              {agent.task}
            </p>
            <div className="flex h-6 items-center gap-2 text-[12.5px]">
              <StatusGlyph status={needsYou ? "waiting" : "running"} label={null} />
              <span className={needsYou ? "text-kura-ember-text" : "text-kura-fg-muted"}>
                {needsYou ? "Needs you" : "Running"}
              </span>
              {needsYou ? (
                <Button
                  size="xs"
                  className="ml-auto"
                  data-agent-confirm={agent.asks}
                  onClick={() => setWaiting(false)}
                >
                  Approve
                </Button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
