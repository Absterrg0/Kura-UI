"use client";

import { FilePen, RotateCcw } from "lucide-react";
import * as React from "react";
import { Button } from "../button";
import { CodeBlock } from "../code-block";
import { ToolCall } from "../tool-call";
import { type ApprovalDecision, ApprovalPrompt } from "./approval-prompt";

export function ApprovalPromptMinimal() {
  return (
    <ApprovalPrompt
      title="Kura wants to run a command"
      command="pnpm install"
      risk="low"
      shortcuts={false}
      className="w-full max-w-lg"
    />
  );
}

export function ApprovalPromptFull() {
  const [decision, setDecision] = React.useState<ApprovalDecision>("pending");
  const [log, setLog] = React.useState<string[]>([]);
  const note = (s: string) => setLog((l) => [...l.slice(-2), s]);
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <ApprovalPrompt
        title="Kura wants to delete a directory"
        command="rm -rf build"
        description="Clears stale output before rebuilding. Affects 1,204 files under ./build only."
        risk="high"
        details={
          <ul className="flex list-disc flex-col gap-1 pl-4">
            <li>Working directory: ~/code/kura-ui</li>
            <li>Requested by step 3 of 5, “Rebuild the docs”</li>
            <li>Not tracked by git — cannot be restored from history</li>
          </ul>
        }
        decision={decision}
        onDecisionChange={setDecision}
        onApprove={() => note("approved")}
        onDeny={() => note("denied")}
        onAlwaysAllow={() => note("always allowed")}
        shortcuts
        approveLabel="Run anyway"
        denyLabel="Deny"
        alwaysAllowLabel="Always allow"
      />
      <div className="flex items-center justify-between">
        <span className="font-kura-mono text-kura-fg-subtle text-xs">
          {log.length ? log.join(" → ") : "Try ⌘↵ or Esc"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          disabled={decision === "pending"}
          onClick={() => setDecision("pending")}
        >
          <RotateCcw /> Reset
        </Button>
      </div>
    </div>
  );
}

export function ApprovalPromptResolved() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <ApprovalPrompt
        title="Kura wants to run a command"
        command="git push origin main"
        risk="medium"
        defaultDecision="approved"
        shortcuts={false}
      />
      <ApprovalPrompt
        title="Kura wants to run a command"
        command="curl -X DELETE https://api.example.com/v1/projects/42"
        risk="high"
        defaultDecision="denied"
        shortcuts={false}
      />
      <ApprovalPrompt
        title="Kura wants to read a file"
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
  const [decision, setDecision] = React.useState<ApprovalDecision>("pending");
  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <ToolCall
        name="edit_file"
        title="Edit src/config.ts"
        icon={<FilePen />}
        status={
          decision === "pending" ? "awaiting-approval" : decision === "denied" ? "error" : "success"
        }
        error={decision === "denied" ? "Denied by user." : undefined}
        duration={decision === "approved" ? 240 : undefined}
        summary="+2 −1"
      />
      <ApprovalPrompt
        title="Apply this edit?"
        icon={<FilePen />}
        risk="low"
        decision={decision}
        onDecisionChange={setDecision}
        shortcuts={false}
        approveLabel="Apply"
        details={<CodeBlock code={DIFF} language="ts" diff header={false} />}
      />
    </div>
  );
}
