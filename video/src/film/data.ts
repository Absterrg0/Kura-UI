import type { FleetAgent } from "@kura/components/agent-fleet";
import type { AgentStatus } from "@kura/components/status-glyph/status-glyph";
import type { TaskListItem } from "@kura/components/task-list";
import type { TraceSpan } from "@kura/components/trace-waterfall";
import { filmNow } from "../lib/clock";

/**
 * One run, told across the film: an agent moving a web app's session handling to the edge, with
 * subagents, tests, a diff, and one step (the production migration) that waits for a person.
 */

/** The run started 1 h 47 min before the film's clock. */
export const RUN_STARTED = () => filmNow() - (1 * 3600 + 47 * 60 + 12) * 1000;

export const PLAN = [
  "Map every call to fetchUser()",
  "Move session refresh to the edge",
  "Patch src/auth/client.ts",
  "Rewrite the session mocks",
  "Run the auth suite",
  "Run the migration on production",
] as const;

/** The plan with `done` steps finished and the next one running. */
export function planItems(done: number, opts: { waitOnLast?: boolean } = {}): TaskListItem[] {
  return PLAN.map((title, i) => {
    let status: AgentStatus = i < done ? "done" : i === done ? "running" : "queued";
    if (opts.waitOnLast && i === PLAN.length - 1 && i === done) status = "waiting";
    return {
      id: `s${i}`,
      title,
      status,
      durationMs: i < done ? [4_200, 9_800, 31_400, 22_100, 48_600, 12_000][i] : undefined,
    };
  });
}

export function traceSpans(now: number): TraceSpan[] {
  const run = (
    id: string,
    s: number,
    e: number,
    rest: Pick<TraceSpan, "name" | "kind"> & Partial<TraceSpan>,
  ): TraceSpan => ({
    id,
    start: s,
    ...(now >= e ? { end: e, status: "done" as const } : { status: "running" as const }),
    ...rest,
  });
  return [
    {
      id: "run",
      name: "Migrate sessions to the edge",
      kind: "agent",
      meta: "claude-opus-5-5",
      start: 0,
      status: "running",
      children: [
        run("plan", 0, 3100, { name: "Plan the migration", kind: "llm" }),
        run("explorer", 900, 6100, { name: "explorer", kind: "agent", meta: "23 call sites" }),
        run("read", 3200, 3900, { name: "read_file", kind: "tool", meta: "src/auth/client.ts" }),
        run("patch", 3800, 9800, { name: "Write the patch", kind: "llm" }),
        run("tests", 6400, 12600, { name: "test-writer", kind: "agent", meta: "session mocks" }),
        run("bash", 9900, 11800, { name: "bash", kind: "tool", meta: "pnpm test src/auth" }),
        run("review", 11900, 14200, { name: "reviewer", kind: "agent", meta: "the diff" }),
      ],
    },
  ];
}

export function fleet(k: number): FleetAgent[] {
  return [
    {
      id: "explorer",
      name: "explorer",
      role: "Maps call sites",
      status: "done",
      activity: "Found 23 calls to fetchUser()",
      tokens: 84_200,
    },
    {
      id: "migrator",
      name: "migrator",
      role: "Moves sessions",
      status: k >= 3 ? "done" : "running",
      activity: k >= 3 ? "Patched 4 files" : "Patching src/auth/client.ts",
      progress: Math.min(1, 0.55 + 0.15 * k),
      tokens: 61_400 + k * 2_100,
    },
    {
      id: "test-writer",
      name: "test-writer",
      role: "Updates tests",
      status: k >= 6 ? "done" : "running",
      activity: k >= 6 ? "31 tests pass" : "Rewriting the session mocks",
      progress: Math.min(1, 0.3 + 0.12 * k),
      tokens: 31_900 + k * 1_400,
    },
    {
      id: "reviewer",
      name: "reviewer",
      role: "Reviews the diff",
      status: k >= 2 ? "running" : "queued",
      activity: k >= 2 ? "Reading the diff" : "Starts when the patches land",
      progress: k >= 2 ? 0.1 + 0.08 * (k - 2) : undefined,
      tokens: k >= 2 ? 4_100 + k * 900 : undefined,
    },
  ];
}

export const DIFF = `diff --git a/src/auth/client.ts b/src/auth/client.ts
--- a/src/auth/client.ts
+++ b/src/auth/client.ts
@@ -1,7 +1,8 @@
 import { cache } from "react";
-import { fetchJson } from "@/lib/http";
-import type { Session, User } from "./types";
+import { createAuthClient, type Session, type User } from "@acme/auth";

-const SESSION_URL = "/api/v1/session";
-const REFRESH_URL = "/api/v1/session/refresh";
+export const auth = createAuthClient({
+  baseUrl: process.env.NEXT_PUBLIC_AUTH_URL,
+  refresh: "auto",
+});

@@ -9,14 +10,10 @@ const REFRESH_URL = "/api/v1/session/refresh";
 export const fetchUser = cache(async (): Promise<User | null> => {
-  const res = await fetchJson<Session>(SESSION_URL, { credentials: "include" });
-  if (!res.ok) return null;
-  return res.data.user;
+  const session = await auth.getSession();
+  return session?.user ?? null;
 });

-export async function refreshSession(token: string): Promise<Session> {
-  const res = await fetchJson<Session>(REFRESH_URL, {
-    method: "POST",
-    body: JSON.stringify({ token }),
-  });
-  if (!res.ok) throw new Error(\`refresh failed: \${res.status}\`);
-  return res.data;
+export async function refreshSession(session: Session): Promise<Session> {
+  const next = await auth.refresh(session.refreshToken);
+  if (!next) throw new Error("refresh failed: session revoked");
+  return next;
 }`;

const green = (s: string) => `\x1b[32m${s}\x1b[39m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[22m`;
const gray = (s: string) => `\x1b[90m${s}\x1b[39m`;
export const TEST_LINES = [
  `${dim("> vitest run src/auth")}`,
  "",
  ` ${green("✓")} ${dim("src/auth/")}session.test.ts ${gray("(6 tests)")} ${gray("41ms")}`,
  ` ${green("✓")} ${dim("src/auth/")}refresh.test.ts ${gray("(5 tests)")} ${gray("63ms")}`,
  ` ${green("✓")} ${dim("src/")}middleware.test.ts ${gray("(4 tests)")} ${gray("18ms")}`,
  ` ${green("✓")} ${dim("src/auth/")}login.test.ts ${gray("(5 tests)")} ${gray("87ms")}`,
  ` ${green("✓")} ${dim("src/routes/")}account.test.ts ${gray("(9 tests)")} ${gray("112ms")}`,
  ` ${green("✓")} ${dim("src/lib/")}http.test.ts ${gray("(2 tests)")} ${gray("9ms")}`,
  "",
  ` ${dim("Test Files")}  ${green("6 passed")} ${gray("(6)")}`,
  `      ${dim("Tests")}  ${green("31 passed")} ${gray("(31)")}`,
];
