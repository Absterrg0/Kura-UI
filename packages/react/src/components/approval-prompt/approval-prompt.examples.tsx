"use client";

import { RotateCcw } from "lucide-react";
import * as React from "react";
import { Button } from "../button";
import { CodeBlock } from "../code-block";
import { type ApprovalDecision, ApprovalPrompt } from "./approval-prompt";

export function ApprovalPromptMinimal() {
  return (
    <ApprovalPrompt
      title="Install dependencies"
      command="pnpm install"
      risk="low"
      shortcuts={false}
      className="w-full max-w-lg"
    />
  );
}

export function ApprovalPromptFull() {
  const [decision, setDecision] = React.useState<ApprovalDecision>("pending");
  const [asked] = React.useState(() => Date.now() - 14_000);
  const prompt = React.useRef<HTMLElement>(null);
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <ApprovalPrompt
        ref={prompt}
        title="Run the sessions migration on production"
        agent={{ name: "migrator", detail: "for step 4 of the plan" }}
        requestedAt={asked}
        command="pnpm db:migrate --env production"
        facts={[
          { label: "Target", value: "acme-prod · Postgres 16" },
          { label: "Rows affected", value: "48,210" },
          { label: "Rollback", value: "Snapshot first, about 2 min" },
        ]}
        risk="high"
        details={
          <ul className="flex list-disc flex-col gap-1 pl-4">
            <li>Adds refresh_token_hash to sessions and backfills it</li>
            <li>Takes a short write lock on the table</li>
            <li>A snapshot is taken first</li>
          </ul>
        }
        decision={decision}
        onDecisionChange={setDecision}
        onAlwaysAllow={() => {}}
        shortcuts
        approveLabel="Run migration"
        denyLabel="Deny"
        alwaysAllowLabel="Always allow"
      />
      {decision !== "pending" && (
        <Button
          variant="ghost"
          size="xs"
          className="animate-kura-fade-in self-end"
          onClick={() => {
            setDecision("pending");
            // This key leaves once the prompt is pending again: hand focus to the prompt.
            prompt.current?.focus();
          }}
        >
          <RotateCcw /> Ask again
        </Button>
      )}
    </div>
  );
}

export function ApprovalPromptResolved() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <ApprovalPrompt
        title="Push to main"
        command="git push origin main"
        risk="medium"
        defaultDecision="approved"
        shortcuts={false}
      />
      <ApprovalPrompt
        title="Delete project 42"
        command="curl -X DELETE https://api.example.com/v1/projects/42"
        risk="high"
        defaultDecision="denied"
        shortcuts={false}
      />
      <ApprovalPrompt
        title="Read the example env file"
        command="cat .env.example"
        risk="low"
        defaultDecision="always"
        onAlwaysAllow={() => {}}
        shortcuts={false}
      />
    </div>
  );
}

const DIFF = `@@ -1,4 +1,5 @@
 export const config = {
-  retries: 1,
+  retries: 3,
+  backoff: "exponential",
   timeout: 12_000,
 };`;

export function ApprovalPromptWithDiff() {
  return (
    <ApprovalPrompt
      title="Apply this edit to src/config.ts"
      agent={{ name: "Kura", detail: "two lines in one file" }}
      risk="low"
      shortcuts={false}
      approveLabel="Apply"
      details={<CodeBlock code={DIFF} language="ts" diff header={false} />}
      defaultDetailsOpen
      className="w-full max-w-lg"
    />
  );
}
