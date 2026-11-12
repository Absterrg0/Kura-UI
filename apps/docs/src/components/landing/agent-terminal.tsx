"use client";

import { Terminal } from "@kura-ui/react/terminal";
import { cn } from "@/lib/cn";

const ESC = "\u001b[";
const c = (code: string, s: string) => `${ESC}${code}m${s}${ESC}0m`;
const dot = c("32", "⏺");
const tree = c("2", "⎿");

/** The install story, told in a Kura Terminal: add the MCP server, then ask for components. */
export function AgentTerminal({ site, className }: { site: string; className?: string }) {
  const lines = [
    `${c("32", "✓")} Added stdio MCP server ${c("1", "kura")} to .mcp.json`,
    "",
    `${c("2", "$")} claude`,
    `${c("1", ">")} add per-hunk review for the agent's edits, and a terminal for its test runs`,
    "",
    `${dot} kura · search_components ${c("2", '("review agent edits per hunk")')}`,
    `  ${tree}  diff-view, file-changes`,
    `${dot} kura · search_components ${c("2", '("stream command output")')}`,
    `  ${tree}  terminal`,
    `${dot} kura · get_install_instructions ${c("2", '("diff-view", "terminal")')}`,
    `${dot} Bash ${c("2", `(npx shadcn@latest add ${site}/r/diff-view.json ${site}/r/terminal.json)`)}`,
    `  ${tree}  ${c("32", "✓")} components/kura/diff-view/diff-view.tsx`,
    `     ${c("32", "✓")} components/kura/terminal/terminal.tsx`,
    `     ${c("32", "✓")} components/kura/terminal/ansi.ts`,
    `${dot} Edit ${c("2", "(app/review/page.tsx)")}`,
    `  ${tree}  ${c("32", "+ <DiffView diff={patch} onReviewChange={saveReview} />")}`,
    `     ${c("32", "+ <Terminal stream={run.stdout} cwd={run.cwd} />")}`,
    `${dot} Bash ${c("2", "(pnpm tsc --noEmit)")}`,
    `  ${tree}  ${c("32", "✓")} No type errors`,
    "",
    `${dot} Added a review page with ${c("36", "<DiffView />")} and ${c("36", "<Terminal />")}.`,
  ];
  return (
    <Terminal
      className={cn("gloss", className)}
      title="~/acme-web"
      command="claude mcp add kura -- npx -y @kura-ui/mcp"
      lines={lines}
      status="done"
      exitCode={0}
      duration={2_140}
      maxHeight={560}
      wrap={false}
    />
  );
}
