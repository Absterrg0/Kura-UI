import Link from "next/link";
import { cn } from "@/lib/cn";
import { ScaleToFit } from "../scale-to-fit";
import { LiveExample } from "./live-example";

interface Feature {
  slug: string;
  example: string;
  title: string;
  body: string;
  span: string;
  /** Width the component is laid out at; it scales down to the card, never crops sideways. */
  width: number;
}

// Rows: 7 + 5, 5 + 7, 4 + 4 + 4 on a 12-column grid.
const FEATURES: Feature[] = [
  {
    slug: "diff-view",
    example: "DiffViewMinimal",
    title: "Diff review",
    body: "Accept or reject the agent's edits hunk by hunk, with j, k, a and r on the keyboard.",
    span: "lg:col-span-7",
    width: 680,
  },
  {
    slug: "task-list",
    example: "TaskListFull",
    title: "Plan",
    body: "The agent's todo list as it works: what's done, what's running, what failed and why.",
    span: "lg:col-span-5",
    width: 440,
  },
  {
    slug: "approval-prompt",
    example: "ApprovalPromptFull",
    title: "Approvals",
    body: "Risky actions wait for a person. ⌘↵ approves, Esc denies.",
    span: "lg:col-span-5",
    width: 500,
  },
  {
    slug: "trace-waterfall",
    example: "TraceWaterfallFull",
    title: "Trace",
    body: "Every model call, tool and subagent on one time axis, growing live.",
    span: "lg:col-span-7",
    width: 720,
  },
  {
    slug: "terminal",
    example: "TerminalMinimal",
    title: "Terminal",
    body: "Real ANSI output with a live clock, exit codes and copy.",
    span: "md:col-span-1 lg:col-span-4",
    width: 420,
  },
  {
    slug: "prompt-queue",
    example: "PromptQueueMinimal",
    title: "Prompt queue",
    body: "Queue follow-ups while the agent works. Reorder, edit, or send one now.",
    span: "lg:col-span-4",
    width: 420,
  },
  {
    slug: "browser-session",
    example: "BrowserSessionMinimal",
    title: "Browser session",
    body: "Computer use made legible: the page, the cursor and each step.",
    span: "md:col-span-2 lg:col-span-4",
    width: 440,
  },
];

export function FeatureBento() {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-12 lg:gap-4">
      {FEATURES.map((f) => (
        <article
          key={f.slug}
          className={cn(
            "gloss gloss-hover group relative flex flex-col overflow-hidden rounded-[20px] bg-kura-surface",
            f.span,
          )}
        >
          <div className="flex flex-col gap-1.5 px-6 pt-6 md:px-7 md:pt-7">
            <h3 className="font-semibold text-[17px] tracking-[-0.015em]">
              <Link
                href={`/components/${f.slug}`}
                className="outline-none after:absolute after:inset-0 after:z-10 after:rounded-[20px] focus-visible:after:shadow-[inset_0_0_0_2px_var(--kura-ring)]"
              >
                {f.title}
              </Link>
            </h3>
            <p className="max-w-[28rem] text-[14.5px] text-kura-fg-muted leading-relaxed">
              {f.body}
            </p>
          </div>
          <div
            inert
            className="live-gloss fade-b relative mt-6 h-[300px] overflow-hidden px-6 md:px-7"
          >
            <ScaleToFit width={f.width}>
              <LiveExample slug={f.slug} name={f.example} lazy />
            </ScaleToFit>
          </div>
        </article>
      ))}
    </div>
  );
}
