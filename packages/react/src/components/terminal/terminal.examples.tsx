"use client";

import { Square } from "lucide-react";
import * as React from "react";
import { Button } from "../button";
import { Terminal } from "./terminal";

// ANSI helpers for realistic CLI output.
const dim = (s: string) => `\x1b[2m${s}\x1b[22m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[22m`;
const red = (s: string) => `\x1b[31m${s}\x1b[39m`;
const green = (s: string) => `\x1b[32m${s}\x1b[39m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[39m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[39m`;
const gray = (s: string) => `\x1b[90m${s}\x1b[39m`;
const badge = (s: string, color: 31 | 32 | 34 | 36) => `\x1b[1;7;${color}m ${s} \x1b[0m`;

const TEST_OUTPUT = [
  "",
  `> @acme/web@0.42.0 test ${dim("/Users/kura/acme/web")}`,
  "> vitest run",
  "",
  ` ${badge("RUN", 36)} ${cyan("v3.2.4")} ${gray("/Users/kura/acme/web")}`,
  "",
  ` ${green("✓")} ${dim("src/auth/__tests__/")}session.test.ts ${gray("(6 tests)")} ${gray("41ms")}`,
  ` ${green("✓")} ${dim("src/")}middleware.test.ts ${gray("(4 tests)")} ${gray("18ms")}`,
  ` ${green("✓")} ${dim("src/routes/__tests__/")}account.test.ts ${gray("(9 tests)")} ${gray("112ms")}`,
  ` ${yellow("❯")} ${dim("src/auth/__tests__/")}login.test.ts ${gray("(5 tests | ")}${red("1 failed")}${gray(")")} ${gray("87ms")}`,
  `   ${green("✓")} login ${gray(">")} detects an expired session ${gray("2ms")}`,
  `   ${red("×")} login ${gray(">")} refreshes an expired session ${gray("14ms")}`,
  `     ${red("→ expected 'tok_expired' to be 'tok_next' // Object.is equality")}`,
  ` ${green("✓")} ${dim("src/lib/__tests__/")}http.test.ts ${gray("(7 tests)")} ${gray("9ms")}`,
  "",
  red(`⎯⎯⎯⎯⎯⎯⎯ ${bold("Failed Tests 1")} ⎯⎯⎯⎯⎯⎯⎯`),
  "",
  ` ${badge("FAIL", 31)} src/auth/__tests__/login.test.ts ${gray(">")} login ${gray(">")} refreshes an expired session`,
  `${red(bold("AssertionError"))}${red(": expected 'tok_expired' to be 'tok_next' // Object.is equality")}`,
  "",
  `${green("- Expected")}`,
  `${red("+ Received")}`,
  "",
  `${green("- tok_next")}`,
  `${red("+ tok_expired")}`,
  "",
  ` ${cyan("❯")} src/auth/__tests__/login.test.ts:18:32`,
  gray("     16|     const next = await refreshSession(session);"),
  gray('     17|     expect(next.user.id).toBe("u_1");'),
  `     18|     expect(next.refreshToken).toBe(${green('"tok_next"')});`,
  `       | ${red("                               ^")}`,
  "",
  ` ${dim("Test Files")}  ${bold(red("1 failed"))} ${gray("|")} ${bold(green("4 passed"))} ${gray("(5)")}`,
  `      ${dim("Tests")}  ${bold(red("1 failed"))} ${gray("|")} ${bold(green("30 passed"))} ${gray("(31)")}`,
  `   ${dim("Start at")}  14:02:11`,
  `   ${dim("Duration")}  1.42s ${gray("(transform 212ms, setup 0ms, collect 610ms, tests 267ms)")}`,
  "",
  `${red(" ELIFECYCLE ")} ${red("Test failed. See above for more details.")}`,
];

export function TerminalMinimal() {
  return (
    <Terminal
      className="w-full max-w-2xl"
      cwd="~/acme/web"
      command="git status --short"
      exitCode={0}
      lines={[
        ` ${yellow("M")} src/auth/client.ts`,
        ` ${yellow("M")} src/middleware.ts`,
        ` ${yellow("M")} src/auth/__tests__/login.test.ts`,
        ` ${red("D")} src/lib/legacy-session.ts`,
      ]}
    />
  );
}

/** Replays output line by line, like a child process's stdout. */
async function* replay(lines: string[], signal: { cancelled: boolean }) {
  for (const [i, line] of lines.entries()) {
    // Collection is slow, results arrive in bursts, the summary lands at once.
    const wait = i < 4 ? 260 : i < 14 ? 180 + (i % 3) * 140 : 35;
    await new Promise((r) => setTimeout(r, wait));
    if (signal.cancelled) return;
    yield `${line}\n`;
  }
}

export function TerminalFull() {
  const [stream, setStream] = React.useState<AsyncIterable<string>>();
  const [exitCode, setExitCode] = React.useState<number | null>(null);
  React.useEffect(() => {
    const signal = { cancelled: false };
    setStream(replay(TEST_OUTPUT, signal));
    return () => {
      signal.cancelled = true;
    };
  }, []);
  return (
    <Terminal
      className="w-full max-w-2xl"
      title="Run tests"
      cwd="~/acme/web"
      command="pnpm test"
      stream={stream}
      status={exitCode == null ? "running" : undefined}
      exitCode={exitCode}
      onStreamEnd={() => setExitCode(1)}
      maxHeight={360}
    />
  );
}

const BUILD_OUTPUT = [
  `   ${bold("▲ Next.js 16.0.1")}`,
  `   - Environments: .env.production`,
  "",
  `   Creating an optimized production build ...`,
  ` ${green("✓")} Compiled successfully in 8.4s`,
  ` ${green("✓")} Linting and checking validity of types`,
  ` ${green("✓")} Collecting page data`,
  // A progress line rewritten in place with carriage returns.
  `   Generating static pages (0/14)\r   Generating static pages (7/14)\r ${green("✓")} Generating static pages (14/14)`,
  ` ${green("✓")} Finalizing page optimization`,
  "",
  `${bold("Route (app)")}                         ${bold("Size")}  ${bold("First Load JS")}`,
  `┌ ○ /                              5.21 kB         ${green("112 kB")}`,
  `├ ○ /_not-found                       990 B         ${green("103 kB")}`,
  `├ ƒ /account                        3.84 kB         ${green("118 kB")}`,
  `├ ƒ /api/health                       142 B         ${green("102 kB")}`,
  `├ ○ /login                          2.67 kB         ${green("115 kB")}`,
  `└ ○ /signup                         2.71 kB         ${green("115 kB")}`,
  `+ First Load JS shared by all       ${green("102 kB")}`,
  "",
  `ƒ Middleware                        ${green("34.1 kB")}`,
  "",
  `○  (Static)   prerendered as static content`,
  `ƒ  (Dynamic)  server-rendered on demand`,
];

export function TerminalCollapsed() {
  return (
    <Terminal
      className="w-full max-w-2xl"
      title="Build"
      cwd="~/acme/web"
      command="pnpm build"
      lines={BUILD_OUTPUT}
      exitCode={0}
      duration={23_400}
      maxLines={9}
      wrap={false}
    />
  );
}

const DEV_LINES = [
  `  ${bold("▲ Next.js 16.0.1")} (Turbopack)`,
  `  - Local:        ${cyan("http://localhost:3000")}`,
  `  - Network:      ${cyan("http://192.168.1.24:3000")}`,
  "",
  ` ${green("✓")} Starting...`,
  ` ${green("✓")} Ready in 1.1s`,
  ` ${gray("○")} Compiling /login ...`,
  ` ${green("✓")} Compiled /login in 640ms`,
  ` GET /login ${green("200")} in 702ms`,
  ` POST /api/auth/session ${green("200")} in 48ms`,
  ` GET /account ${green("200")} in 131ms`,
  ` GET /api/auth/session ${yellow("401")} in 12ms`,
  ` GET /login?next=%2Faccount ${green("200")} in 22ms`,
];

export function TerminalComposition() {
  const [lines, setLines] = React.useState<string[]>(DEV_LINES.slice(0, 6));
  const [stopped, setStopped] = React.useState(false);
  React.useEffect(() => {
    if (stopped) return;
    const id = setInterval(() => {
      setLines((prev) =>
        prev.length < DEV_LINES.length
          ? [...prev, DEV_LINES[prev.length]!]
          : [...prev, ` GET /api/health ${green("200")} in ${4 + (prev.length % 7)}ms`],
      );
    }, 1400);
    return () => clearInterval(id);
  }, [stopped]);
  return (
    <Terminal
      className="w-full max-w-2xl"
      title="Dev server"
      cwd="~/acme/web"
      command="pnpm dev"
      lines={stopped ? [...lines, "^C"] : lines}
      status={stopped ? "done" : "running"}
      maxHeight={240}
      actions={
        !stopped && (
          <Button size="xs" variant="ghost" onClick={() => setStopped(true)}>
            <Square aria-hidden className="size-3 fill-current" />
            Stop
          </Button>
        )
      }
    />
  );
}
