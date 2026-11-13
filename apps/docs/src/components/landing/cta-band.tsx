"use client";

import { Tabs as TabsPrimitive } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/cn";
import { CopyButton } from "../copy-button";
import { CtaLink } from "../cta-link";

/**
 * The close: the line on the left; on the right one install card. Its top row picks how you
 * install and copies the command, the body is the command, and its foot is the way in.
 */
export function CtaBand({ install, count }: { install: string; count: number }) {
  const ways = [
    { id: "shadcn", label: "shadcn", command: install },
    { id: "npm", label: "npm", command: "npm install @kura-ui/react" },
    { id: "cli", label: "CLI", command: "npx @kura-ui/cli add run-header" },
    { id: "mcp", label: "MCP", command: "claude mcp add kura -- npx -y @kura-ui/mcp" },
  ] as const;
  const [way, setWay] = React.useState<string>("shadcn");
  const current = ways.find((w) => w.id === way) ?? ways[0];

  return (
    <section aria-labelledby="cta-title" className="px-4 pt-36 pb-24 md:px-6 md:pt-44 md:pb-28">
      <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center lg:gap-16">
        <div>
          <h2
            id="cta-title"
            className="font-semibold text-[36px] leading-[1.05] tracking-[-0.03em] text-balance md:text-[48px]"
          >
            Start with one component.
          </h2>
          <p className="max-w-sm pt-5 text-[17px] text-kura-fg-muted leading-relaxed">
            React 19 and Tailwind CSS v4. Copy the first one in, then add the rest as your agent
            grows.
          </p>
        </div>

        <TabsPrimitive.Root
          value={way}
          onValueChange={setWay}
          className="sheet flex min-w-0 flex-col overflow-hidden rounded-kura-xl"
        >
          <div className="flex h-12 items-center justify-between gap-3 border-kura-border-subtle border-b pr-2.5 pl-2">
            <TabsPrimitive.List aria-label="Install with" className="flex h-full items-stretch">
              {ways.map((w) => (
                <TabsPrimitive.Trigger
                  key={w.id}
                  value={w.id}
                  className={cn(
                    "relative cursor-pointer px-3 font-medium text-[13px] text-kura-fg-subtle outline-hidden transition-colors duration-150 hover:text-kura-fg focus-visible:text-kura-fg data-[state=active]:text-kura-fg",
                    // The chosen way is underlined with a row of dots.
                    "after:absolute after:inset-x-3 after:-bottom-px after:h-[3px] after:opacity-0 after:transition-opacity after:[background:radial-gradient(circle,var(--kura-fg)_1px,transparent_1.4px)_0_0/4px_3px_repeat-x] data-[state=active]:after:opacity-100",
                  )}
                >
                  {w.label}
                </TabsPrimitive.Trigger>
              ))}
            </TabsPrimitive.List>
            <CopyButton value={current.command} label="Copy install command" />
          </div>
          {ways.map((w) => (
            <TabsPrimitive.Content
              key={w.id}
              value={w.id}
              className="flex min-h-[84px] items-center px-5 py-5 font-kura-mono text-[13.5px] leading-6 outline-hidden focus-visible:shadow-[inset_0_0_0_2px_var(--kura-ring)]"
            >
              <p className="min-w-0 [overflow-wrap:anywhere]">
                <span aria-hidden className="select-none pr-2.5 text-kura-fg-subtle">
                  $
                </span>
                {w.command}
              </p>
            </TabsPrimitive.Content>
          ))}
          <div className="flex flex-wrap items-center justify-between gap-3 border-kura-border-subtle border-t bg-kura-surface-sunken/40 py-3 pr-3 pl-5">
            <span className="text-[13px] text-kura-fg-subtle">
              {count} components, one manifest each.
            </span>
            <CtaLink href="/components" size="sm">
              Browse components
            </CtaLink>
          </div>
        </TabsPrimitive.Root>
      </div>
    </section>
  );
}
