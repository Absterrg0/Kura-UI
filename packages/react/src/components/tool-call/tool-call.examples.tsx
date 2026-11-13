"use client";

import * as React from "react";
import { Button } from "../button";
import { ToolCall, type ToolCallStatus } from "./tool-call";

export function ToolCallMinimal() {
  return (
    <ToolCall
      name="read_file"
      status="success"
      duration={182}
      args={{ path: "src/app/page.tsx" }}
      result={"export default function Page() {\n  return <Chat />;\n}"}
      className="w-full max-w-lg"
    />
  );
}

const RESULT = {
  title: "useOptimistic – React",
  url: "https://react.dev/reference/react/useOptimistic",
};

export function ToolCallFull() {
  const [status, setStatus] = React.useState<ToolCallStatus>("pending");
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const a = setTimeout(() => setStatus("running"), 700);
    const b = setTimeout(() => {
      setStatus("success");
      setOpen(true);
    }, 3100);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);

  return (
    <ToolCall
      name="search_web"
      title={status === "success" ? "Searched the web" : "Searching the web"}
      status={status}
      args={{ query: "react useOptimistic rollback", max_results: 1 }}
      result={status === "success" ? RESULT : undefined}
      summary="react useOptimistic rollback"
      variant="card"
      open={open}
      onOpenChange={setOpen}
      className="w-full max-w-lg"
    />
  );
}

export function ToolCallStates() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <ToolCall name="list_files" status="pending" args={{ dir: "src/components" }} />
      <ToolCall name="run_tests" status="running" args={{ filter: "src/auth" }} />
      <ToolCall
        name="read_file"
        status="success"
        duration={96}
        args={{ path: "README.md" }}
        result="# Kura UI"
      />
      <ToolCall
        name="deploy_preview"
        status="error"
        duration={4210}
        args={{ branch: "feat/session-refresh" }}
        error="Type error in src/middleware.ts:31"
        defaultOpen={false}
      />
    </div>
  );
}

export function ToolCallInline() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-2 text-[15px] text-kura-fg leading-relaxed">
      <p>I checked the docs before answering:</p>
      <ToolCall
        variant="inline"
        name="fetch_url"
        title="Read react.dev"
        status="success"
        duration={640}
        args={{ url: "https://react.dev/reference/react/useOptimistic" }}
        result={{ status: 200, bytes: 48213 }}
      />
      <p>The hook drops the optimistic value automatically when the action throws.</p>
    </div>
  );
}

export function ToolCallApproval() {
  const [status, setStatus] = React.useState<ToolCallStatus>("awaiting-approval");
  return (
    <ToolCall
      name="run_command"
      title="Run a shell command"
      status={status}
      args={{ command: "pnpm db:migrate --env production" }}
      result={status === "success" ? "Applied 3 migrations." : undefined}
      duration={status === "success" ? 1830 : undefined}
      className="w-full max-w-lg"
      actions={
        status === "awaiting-approval" ? (
          <>
            <Button variant="secondary" onClick={() => setStatus("error")}>
              Deny
            </Button>
            <Button onClick={() => setStatus("success")}>Approve</Button>
          </>
        ) : undefined
      }
      error={status === "error" ? "Denied by you. Nothing ran." : undefined}
    />
  );
}
