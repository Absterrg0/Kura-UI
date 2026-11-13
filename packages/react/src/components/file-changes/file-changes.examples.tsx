"use client";

import * as React from "react";
import { DiffView, parseUnifiedDiff } from "../diff-view";
import { type FileChange, FileChanges } from "./file-changes";

const CHANGES: FileChange[] = [
  { path: "src/auth/client.ts", status: "M", additions: 13, deletions: 16 },
  { path: "src/auth/types.ts", status: "A", additions: 6 },
  { path: "src/auth/__tests__/login.test.ts", status: "M", additions: 7, deletions: 5 },
  { path: "src/middleware.ts", status: "M", additions: 2, deletions: 2 },
  { path: "src/lib/legacy-session.ts", status: "D", deletions: 10 },
  { path: "src/routes/account/page.tsx", status: "M", additions: 4, deletions: 4 },
  { path: "package.json", status: "M", additions: 1, deletions: 1 },
];

export function FileChangesMinimal() {
  return <FileChanges files={CHANGES} className="w-full max-w-sm" />;
}

/** Snapshots of what the agent has touched, one per step of the run. */
const STEPS: FileChange[][] = [
  [{ path: "src/auth/client.ts", status: "M", state: "reading" }],
  [{ path: "src/auth/client.ts", status: "M", additions: 4, deletions: 6, state: "editing" }],
  [
    { path: "src/auth/client.ts", status: "M", additions: 13, deletions: 16 },
    { path: "src/middleware.ts", status: "M", additions: 1, deletions: 1, state: "editing" },
  ],
  [
    { path: "src/auth/client.ts", status: "M", additions: 13, deletions: 16 },
    { path: "src/middleware.ts", status: "M", additions: 2, deletions: 2 },
    { path: "src/auth/types.ts", status: "A", additions: 3, state: "editing" },
  ],
  [
    { path: "src/auth/client.ts", status: "M", additions: 13, deletions: 16 },
    { path: "src/middleware.ts", status: "M", additions: 2, deletions: 2 },
    { path: "src/auth/types.ts", status: "A", additions: 6 },
    {
      path: "src/auth/__tests__/login.test.ts",
      status: "M",
      additions: 2,
      deletions: 3,
      state: "editing",
    },
  ],
  [
    { path: "src/auth/client.ts", status: "M", additions: 13, deletions: 16 },
    { path: "src/middleware.ts", status: "M", additions: 2, deletions: 2 },
    { path: "src/auth/types.ts", status: "A", additions: 6 },
    { path: "src/auth/__tests__/login.test.ts", status: "M", additions: 7, deletions: 5 },
    { path: "src/lib/legacy-session.ts", status: "D", deletions: 10 },
    {
      path: "src/routes/account/page.tsx",
      status: "M",
      additions: 1,
      deletions: 1,
      state: "editing",
    },
  ],
  CHANGES,
];

export function FileChangesFull() {
  const [step, setStep] = React.useState(0);
  const [selected, setSelected] = React.useState<string | null>("src/auth/client.ts");
  React.useEffect(() => {
    if (step >= STEPS.length - 1) return;
    const id = setTimeout(() => setStep((s) => s + 1), step === 0 ? 1400 : 1800);
    return () => clearTimeout(id);
  }, [step]);
  return (
    <FileChanges
      title="Changes"
      files={STEPS[step]!}
      selectedPath={selected}
      onSelect={setSelected}
      className="w-full max-w-sm"
    />
  );
}

export function FileChangesList() {
  return (
    <FileChanges
      files={CHANGES}
      defaultView="list"
      defaultSelectedPath="src/middleware.ts"
      className="w-full max-w-md"
    />
  );
}

const AUTH_MIGRATION_DIFF = `diff --git a/src/auth/client.ts b/src/auth/client.ts
index 887cccf..1c08d5a 100644
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
 }
@@ -24,3 +21,3 @@ export async function refreshSession(token: string): Promise<Session> {
 export function isExpired(session: Session, now = Date.now()): boolean {
-  return session.expiresAt < now;
+  return session.expiresAt <= now;
 }
@@ -28,3 +25,3 @@ export function isExpired(session: Session, now = Date.now()): boolean {
 export async function signOut(): Promise<void> {
-  await fetchJson(SESSION_URL, { method: "DELETE", credentials: "include" });
+  await auth.signOut();
 }
diff --git a/src/auth/__tests__/login.test.ts b/src/auth/__tests__/login.test.ts
index 9fe0aaf..711a4bd 100644
--- a/src/auth/__tests__/login.test.ts
+++ b/src/auth/__tests__/login.test.ts
@@ -1,4 +1,4 @@
 import { describe, expect, it, vi } from "vitest";
-import { refreshSession, isExpired } from "../client";
+import { auth, isExpired, refreshSession } from "../client";
 
 describe("login", () => {
@@ -8,8 +8,10 @@ describe("login", () => {
 
   it("refreshes an expired session", async () => {
-    vi.spyOn(globalThis, "fetch").mockResolvedValue(
-      new Response(JSON.stringify({ expiresAt: 10, user: { id: "u_1" } })),
-    );
-    const next = await refreshSession("tok_expired");
+    vi.spyOn(auth, "refresh").mockResolvedValue({
+      expiresAt: 10,
+      refreshToken: "tok_next",
+      user: { id: "u_1" },
+    } as never);
+    const next = await refreshSession({ refreshToken: "tok_expired" } as never);
     expect(next.user.id).toBe("u_1");
   });
diff --git a/src/lib/legacy-session.ts b/src/lib/legacy-session.ts
deleted file mode 100644
index f0ae86d..0000000
--- a/src/lib/legacy-session.ts
+++ /dev/null
@@ -1,10 +0,0 @@
-/** @deprecated Use \`auth.getSession()\` from @acme/auth. */
-export function readSessionCookie(cookie: string | null) {
-  const raw = cookie?.match(/acme_session=([^;]+)/)?.[1];
-  if (!raw) return null;
-  try {
-    return JSON.parse(atob(raw)) as { userId: string; expiresAt: number };
-  } catch {
-    return null;
-  }
-}
diff --git a/src/middleware.ts b/src/middleware.ts
index 0e93409..7eda2e2 100644
--- a/src/middleware.ts
+++ b/src/middleware.ts
@@ -1,4 +1,4 @@
 import { NextResponse, type NextRequest } from "next/server";
-import { readSessionCookie } from "@/lib/legacy-session";
+import { auth } from "@/auth/client";
 
 const PUBLIC_PATHS = ["/login", "/signup", "/api/health"];
@@ -8,5 +8,5 @@ export async function middleware(request: NextRequest) {
   if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();
 
-  const session = readSessionCookie(request.headers.get("cookie"));
+  const session = await auth.getSession({ headers: request.headers });
   if (!session) {
     const url = new URL("/login", request.url);
`;

const REVIEW_FILES = parseUnifiedDiff(AUTH_MIGRATION_DIFF);

export function FileChangesComposition() {
  const [selected, setSelected] = React.useState("src/auth/client.ts");
  const files: FileChange[] = REVIEW_FILES.map((f) => {
    const lines = f.hunks.flatMap((h) => h.lines);
    return {
      path: f.path,
      status:
        f.status === "added"
          ? "A"
          : f.status === "deleted"
            ? "D"
            : f.status === "renamed"
              ? "R"
              : "M",
      additions: lines.filter((l) => l.kind === "add").length,
      deletions: lines.filter((l) => l.kind === "remove").length,
    };
  });
  const current = REVIEW_FILES.filter((f) => f.path === selected);
  return (
    <div className="grid w-full max-w-4xl items-start gap-3 md:grid-cols-[17rem_1fr]">
      <FileChanges
        files={files}
        selectedPath={selected}
        onSelect={setSelected}
        viewToggle={false}
      />
      <DiffView
        title={selected.split("/").pop()}
        files={current}
        reviewable={false}
        maxHeight={440}
      />
    </div>
  );
}
