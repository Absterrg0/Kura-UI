import Link from "next/link";
import type * as React from "react";
import { cn } from "@/lib/cn";
import { ScaleToFit } from "../scale-to-fit";
import { CheckpointsDemo, QueueDemo, TerminalDemo } from "./bento-demos";
import { LiveExample } from "./live-example";

interface Feature {
  slug: string;
  title: string;
  body: string;
  span: string;
  /** Width the component is laid out at; it scales down to the card, never crops sideways. */
  width: number;
  /** A generated example by name, or a composed demo sized for the card. */
  example?: string;
  demo?: React.ComponentType;
  /** Tall panels run off the bottom of the card behind a soft fade. */
  crop?: boolean;
}

// Rows: 7 + 5, 5 + 7, then three equal short cards.
const FEATURES: Feature[] = [
  {
    slug: "diff-view",
    example: "DiffViewMinimal",
    title: "Diff review",
    body: "Accept or reject the agent's edits hunk by hunk, with j, k, a and r on the keyboard.",
    span: "lg:col-span-7",
    width: 680,
    crop: true,
  },
  {
    slug: "task-list",
    example: "TaskListFull",
    title: "Plan",
    body: "The agent's todo list as it works: what's done, what's running, what failed and why.",
    span: "lg:col-span-5",
    width: 460,
    crop: true,
  },
  {
    slug: "browser-session",
    example: "BrowserSessionMinimal",
    title: "Browser session",
    body: "Computer use made legible: the page, the agent's cursor and each step.",
    span: "lg:col-span-5",
    width: 480,
    crop: true,
  },
  {
    slug: "trace-waterfall",
    example: "TraceWaterfallFull",
    title: "Trace",
    body: "Every model call, tool and subagent on one time axis, growing live.",
    span: "lg:col-span-7",
    width: 720,
    crop: true,
  },
  {
    slug: "terminal",
    demo: TerminalDemo,
    title: "Terminal",
    body: "Real ANSI output with a live clock, exit codes and copy.",
    span: "lg:col-span-4",
    width: 380,
  },
  {
    slug: "prompt-queue",
    demo: QueueDemo,
    title: "Prompt queue",
    body: "Queue follow-ups while the agent works. Reorder, edit, or send one now.",
    span: "lg:col-span-4",
    width: 380,
  },
  {
    slug: "checkpoints",
    demo: CheckpointsDemo,
    title: "Checkpoints",
    body: "Restore points across the run. Roll back to any of them in one step.",
    span: "md:col-span-2 lg:col-span-4",
    width: 380,
  },
];

export function FeatureBento() {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-12 lg:gap-4">
      {FEATURES.map((f) => {
        const Demo = f.demo;
        return (
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
              className={cn(
                "live-gloss relative mt-6 overflow-hidden px-6 md:px-7",
                f.crop ? "fade-b h-[300px]" : "pb-6 md:pb-7",
              )}
            >
              <ScaleToFit width={f.width}>
                {Demo ? <Demo /> : <LiveExample slug={f.slug} name={f.example ?? ""} lazy />}
              </ScaleToFit>
            </div>
          </article>
        );
      })}
    </div>
  );
}
