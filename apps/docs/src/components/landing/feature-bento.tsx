import Link from "next/link";
import type * as React from "react";
import { cn } from "@/lib/cn";
import { Reveal } from "../reveal";
import {
  BrowserDemo,
  CheckpointsDemo,
  ConversationDemo,
  FilesDemo,
  QueueDemo,
  ToolsDemo,
  VoiceDemo,
} from "./bento-demos";
import { LiveExample } from "./live-example";

interface Feature {
  slug: string;
  title: string;
  body: string;
  span: string;
  /** A generated example by name, or a composed demo sized for its column. */
  example?: string;
  demo?: React.ComponentType;
}

// Rows: 7 + 5, 5 + 7, then three equal columns. Nothing is boxed: each component sits on the
// page as it would in an app, live, with one line above it. None of them repeats the hero stage.
const FEATURES: Feature[] = [
  {
    slug: "message",
    demo: ConversationDemo,
    title: "Conversation",
    body: "Messages, the reasoning behind them, sources, and the prompt box.",
    span: "lg:col-span-7",
  },
  {
    slug: "file-changes",
    demo: FilesDemo,
    title: "File changes",
    body: "Every file the agent touched, live as it edits.",
    span: "lg:col-span-5",
  },
  {
    slug: "tool-call",
    demo: ToolsDemo,
    title: "Tool calls",
    body: "Each call with its state, arguments and result.",
    span: "lg:col-span-5",
  },
  {
    slug: "browser-session",
    demo: BrowserDemo,
    title: "Browser session",
    body: "Computer use made legible: the page, the cursor, each step.",
    span: "max-md:hidden lg:col-span-7",
  },
  {
    slug: "prompt-queue",
    demo: QueueDemo,
    title: "Prompt queue",
    body: "Queue follow-ups while the agent works.",
    span: "lg:col-span-4",
  },
  {
    slug: "checkpoints",
    demo: CheckpointsDemo,
    title: "Checkpoints",
    body: "Roll the workspace back in one step.",
    span: "lg:col-span-4",
  },
  {
    slug: "agent-orb",
    demo: VoiceDemo,
    title: "Voice",
    body: "An orb and a waveform, drawn in dots.",
    span: "md:col-span-2 lg:col-span-4",
  },
];

export function FeatureBento() {
  return (
    <Reveal className="grid gap-x-4 gap-y-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-y-14">
      {FEATURES.map((f, i) => {
        const Demo = f.demo;
        return (
          <figure
            key={f.slug}
            data-reveal-item
            style={{ "--d": i } as React.CSSProperties}
            className={cn("flex min-w-0 flex-col gap-4", f.span)}
          >
            <figcaption className="flex flex-col gap-0.5 px-0.5">
              <h3 className="font-semibold text-[15px] tracking-[-0.01em]">
                <Link
                  href={`/components/${f.slug}`}
                  className="rounded-[4px] outline-hidden hover:underline hover:decoration-kura-faint hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-kura-ring focus-visible:outline-offset-2"
                >
                  {f.title}
                </Link>
              </h3>
              <p className="text-[14px] text-kura-fg-muted leading-relaxed">{f.body}</p>
            </figcaption>
            {/* Every demo in a row stretches to the row's height, so the row ends on one line. */}
            <div className="flex min-w-0 flex-1 flex-col [&>*]:flex-1">
              {Demo ? <Demo /> : <LiveExample slug={f.slug} name={f.example ?? ""} lazy />}
            </div>
          </figure>
        );
      })}
    </Reveal>
  );
}
