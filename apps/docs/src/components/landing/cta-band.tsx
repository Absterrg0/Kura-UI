import Link from "next/link";
import { CtaLink } from "../cta-link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../tabs";
import { InstallChip } from "./install-chip";

/**
 * The close: the line on the left, and on the right the first command in whichever way you
 * install (shadcn, npm, the CLI or the MCP server), then the way in.
 */
export function CtaBand({ install }: { install: string }) {
  const ways = [
    { id: "shadcn", label: "shadcn", command: install },
    { id: "npm", label: "npm", command: "npm install @kura-ui/react" },
    { id: "cli", label: "CLI", command: "npx @kura-ui/cli add run-header" },
    { id: "mcp", label: "MCP", command: "claude mcp add kura -- npx -y @kura-ui/mcp" },
  ];
  return (
    <section aria-labelledby="cta-title" className="px-4 pt-36 pb-24 md:px-6 md:pt-44 md:pb-28">
      <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-end lg:gap-16">
        <div>
          <h2
            id="cta-title"
            className="font-semibold text-[36px] leading-[1.05] tracking-[-0.03em] text-balance md:text-[48px]"
          >
            Start with one component.
          </h2>
          <p className="max-w-md pt-5 text-[17px] text-kura-fg-muted leading-relaxed">
            React 19 and Tailwind CSS v4. Copy the first one in, then add the rest as your agent
            grows.
          </p>
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          <Tabs defaultValue="shadcn" className="flex flex-col gap-3">
            <TabsList aria-label="Install with" className="self-start">
              {ways.map((w) => (
                <TabsTrigger key={w.id} value={w.id}>
                  {w.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {ways.map((w) => (
              <TabsContent key={w.id} value={w.id} className="rounded-kura-lg">
                <InstallChip
                  command={w.command}
                  className="flex min-h-12 w-full items-center py-3 pl-4 text-[13px]"
                />
              </TabsContent>
            ))}
          </Tabs>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <CtaLink href="/components">Browse components</CtaLink>
            <Link
              href="/docs"
              className="rounded-lg px-1 py-1 text-[14.5px] text-kura-fg-muted outline-hidden transition-colors hover:text-kura-fg focus-visible:shadow-kura-focus"
            >
              Read the docs
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
