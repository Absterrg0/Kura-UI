"use client";

import * as React from "react";
import { Button } from "../button";
import { Kbd } from "../kbd";
import { type DiffFileInput, type DiffReview, DiffView } from "./diff-view";

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

const MIDDLEWARE_DIFF = `diff --git a/src/middleware.ts b/src/middleware.ts
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

export function DiffViewMinimal() {
  return <DiffView diff={MIDDLEWARE_DIFF} className="w-full max-w-2xl" />;
}

export function DiffViewFull() {
  const [review, setReview] = React.useState<DiffReview>({
    "src/auth/client.ts#0": "accepted",
  });
  const decisions = Object.values(review);
  const accepted = decisions.filter((d) => d === "accepted").length;
  const rejected = decisions.length - accepted;
  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <DiffView
        title="Review changes"
        diff={AUTH_MIGRATION_DIFF}
        review={review}
        onReviewChange={setReview}
        maxHeight={620}
      />
      <div className="flex items-center gap-3 px-1 text-[12px] text-kura-fg-subtle">
        <span className="flex items-center gap-1.5">
          <Kbd size="sm">J</Kbd>
          <Kbd size="sm">K</Kbd>
          <span>move</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd size="sm">A</Kbd>
          <span>accept</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd size="sm">R</Kbd>
          <span>reject</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd size="sm">U</Kbd>
          <span>undo</span>
        </span>
        <span className="ml-auto font-kura-mono tabular-nums">
          {accepted} accepted · {rejected} rejected
        </span>
      </div>
    </div>
  );
}

const STRUCTURED_FILES: DiffFileInput[] = [
  {
    path: "src/auth/session-store.ts",
    oldPath: "src/auth/session.ts",
    status: "renamed",
    hunks: [
      {
        oldStart: 3,
        newStart: 3,
        section: "export class SessionStore",
        lines: [
          "   #ttl = 15 * 60_000;",
          "-  read(key: string) {",
          "+  read(key: string): Session | undefined {",
          "     return this.#map.get(key);",
        ],
      },
    ],
  },
  {
    path: "src/auth/types.ts",
    status: "added",
    hunks: [
      {
        newStart: 1,
        lines: [
          '+export type { Session, User } from "@acme/auth";',
          "+",
          '+export type AuthProvider = "password" | "github" | "google";',
        ],
      },
    ],
  },
  { path: "public/og-login.png", status: "modified", binary: true, hunks: [] },
];

export function DiffViewStructured() {
  return (
    <DiffView
      title="Patch from test-writer"
      files={STRUCTURED_FILES}
      reviewable={false}
      className="w-full max-w-2xl"
    />
  );
}

export function DiffViewComposition() {
  const [review, setReview] = React.useState<DiffReview>({});
  const [applied, setApplied] = React.useState<number | null>(null);
  const accepted = Object.values(review).filter((d) => d === "accepted").length;
  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <DiffView
        title="kura/auth-client"
        diff={MIDDLEWARE_DIFF}
        review={review}
        onReviewChange={(next) => {
          setReview(next);
          setApplied(null);
        }}
      />
      <div className="flex items-center justify-between gap-3 rounded-kura-xl bg-kura-surface py-2 pr-2 pl-3.5 shadow-kura-sm">
        <span className="text-[13px] text-kura-fg-muted" role="status">
          {applied != null
            ? `Applied ${applied} ${applied === 1 ? "change" : "changes"} to kura/auth-client`
            : accepted > 0
              ? `${accepted} accepted ${accepted === 1 ? "change" : "changes"} ready`
              : "Accept changes to apply them"}
        </span>
        <Button size="sm" disabled={accepted === 0} onClick={() => setApplied(accepted)}>
          Apply changes
        </Button>
      </div>
    </div>
  );
}
