"use client";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@ui-sdk/react/hover-card";
import { ArrowUpRight, Globe } from "lucide-react";
import * as React from "react";
import { useControllableState } from "../../hooks/use-controllable-state";
import { cn } from "../../lib/cn";

export interface CitationSource {
  /** Page title. */
  title: string;
  /** Canonical URL; the domain is derived from it. */
  url: string;
  /** Short excerpt the model relied on. */
  snippet?: string;
  /** Favicon URL. Without one, a monogram tile is shown (no third-party favicon service is called). */
  favicon?: string;
  /** Publisher name shown instead of the domain, e.g. "React Docs". */
  siteName?: string;
  /** Publication date as display text, e.g. "Mar 2025". */
  date?: string;
}

export function sourceDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function Favicon({ source, className }: { source: CitationSource; className?: string }) {
  const [broken, setBroken] = React.useState(false);
  return (
    <span
      aria-hidden
      data-slot="citation-favicon"
      className={cn(
        "grid size-4 shrink-0 place-items-center overflow-hidden rounded-kura-xs text-kura-fg-subtle",
        className,
      )}
    >
      {source.favicon && !broken ? (
        <img
          src={source.favicon}
          alt=""
          className="size-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <Globe aria-hidden strokeWidth={1.75} className="size-3.5" />
      )}
    </span>
  );
}

// ------------------------------------------------------------------------------------------------
// Card
// ------------------------------------------------------------------------------------------------

export interface CitationCardProps extends React.ComponentProps<"div"> {
  /** The source to preview. */
  source: CitationSource;
  /** Citation number shown in the corner. */
  index?: number;
}

/** The preview body: favicon, site, title (a link), snippet. Used in the hover card; reusable in sidebars. */
export function CitationCard({ source, index, className, ...props }: CitationCardProps) {
  const domain = sourceDomain(source.url);
  return (
    <div
      data-slot="citation-card"
      className={cn("flex flex-col gap-1.5 font-kura-sans", className)}
      {...props}
    >
      <div className="flex items-center gap-2 text-kura-fg-subtle text-xs">
        <Favicon source={source} />
        <span className="min-w-0 flex-1 truncate">
          {source.siteName ?? domain}
          {source.date && <span className="text-kura-fg-subtle"> · {source.date}</span>}
        </span>
        {index != null && <span className="font-kura-mono tabular-nums">{index}</span>}
      </div>
      <a
        href={source.url}
        target="_blank"
        rel="noreferrer"
        className="group/title -mx-1 line-clamp-2 rounded-kura-xs px-1 font-medium text-kura-fg text-sm leading-snug outline-hidden hover:underline hover:decoration-kura-border-strong hover:underline-offset-2 focus-visible:shadow-kura-focus"
      >
        {source.title}
        <ArrowUpRight
          aria-hidden
          className="ml-0.5 inline size-3.5 align-[-2px] text-kura-fg-subtle transition-transform duration-(--kura-duration-fast) ease-kura-out group-hover/title:translate-x-px group-hover/title:-translate-y-px motion-reduce:transition-none"
        />
      </a>
      {source.snippet && (
        <p className="line-clamp-3 text-[13px] text-kura-fg-muted leading-relaxed">
          {source.snippet}
        </p>
      )}
    </div>
  );
}

// ------------------------------------------------------------------------------------------------
// Inline citation
// ------------------------------------------------------------------------------------------------

export interface CitationProps extends Omit<React.ComponentProps<"a">, "href" | "children"> {
  /** 1-based citation number printed on the key. */
  index: number;
  /** The cited source. */
  source: CitationSource;
  /** Key label: the number (default) or the source's domain/site name. */
  display?: "number" | "domain";
  /** Hover delay before the preview opens, in ms. Default 250. */
  openDelay?: number;
  /** Preview open (controlled). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Inline numbered citation, drawn as a small keycap. It is a real link to the source; hovering or keyboard-focusing
 * it opens a preview card with favicon, title, domain and snippet.
 */
export function Citation({
  index,
  source,
  display = "number",
  openDelay = 250,
  open: openProp,
  onOpenChange,
  className,
  ...props
}: CitationProps) {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: false,
    onChange: onOpenChange,
  });
  const domain = sourceDomain(source.url);
  const label = display === "domain" ? (source.siteName ?? domain) : String(index);

  return (
    <HoverCard
      open={open}
      onOpenChange={(next) => setOpen(next)}
      delay={openDelay}
      closeDelay={150}
    >
      <HoverCardTrigger
        render={<a data-slot="citation" href={source.url} target="_blank" rel="noreferrer" />}
        data-state={open ? "open" : "closed"}
        // The name starts with what the key shows, so it can be found by what is on screen.
        aria-label={
          display === "domain"
            ? `${label}, source ${index}: ${source.title}`
            : `Source ${index}: ${source.title} (${domain})`
        }
        className={cn(
          // A citation is a small keycap with the source number printed on it.
          "relative -top-[0.1em] mr-px ml-1 inline-flex h-[1.35em] min-w-[1.35em] items-center justify-center gap-1 rounded-[5px] bg-kura-raised px-[0.35em] align-middle font-kura-mono font-medium text-[0.7em] text-kura-fg-muted tabular-nums leading-none no-underline shadow-kura-key outline-hidden",
          "transition-[background-color,color] duration-(--kura-duration-fast) ease-kura-snap hover:bg-kura-raised-hover hover:text-kura-fg focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-kura-ring focus-visible:outline-offset-1 data-open:bg-kura-raised-hover data-open:text-kura-fg",
          className,
        )}
        {...props}
      >
        {display === "domain" && (
          <Favicon source={source} className="-ml-px size-[1.1em] rounded-[3px]" />
        )}
        {label}
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="start"
        sideOffset={6}
        render={<div data-slot="citation-preview" />}
        className={cn(
          "z-50 m-0 w-80 max-w-[calc(100vw-16px)] overflow-visible rounded-kura-xl border-0 bg-kura-raised p-3 font-kura-sans text-[13px] text-kura-fg shadow-kura-popover outline-hidden",
          "origin-(--transform-origin) transition-[opacity,scale] duration-(--kura-duration-base) ease-kura-snap",
          "data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 motion-reduce:transition-none",
        )}
      >
        <CitationCard source={source} index={index} />
      </HoverCardContent>
    </HoverCard>
  );
}

// ------------------------------------------------------------------------------------------------
// Sources
// ------------------------------------------------------------------------------------------------

export interface SourcesProps extends React.ComponentProps<"div"> {
  /** Sources in citation order (index = position + 1). */
  sources: readonly CitationSource[];
  /** `strip` = a horizontally scrolling row of chips; `list` = a numbered list with titles and snippets. Default "strip". */
  variant?: "strip" | "list";
  /** Heading text. Default “Sources”. Pass null to hide it. */
  label?: React.ReactNode;
}

/** The sources behind an answer, as a compact chip strip or a numbered list. */
export function Sources({
  sources,
  variant = "strip",
  label = "Sources",
  className,
  ...props
}: SourcesProps) {
  const id = React.useId();
  return (
    <div
      data-slot="citation-sources"
      data-variant={variant}
      className={cn("flex min-w-0 flex-col gap-2 font-kura-sans", className)}
      {...props}
    >
      {label != null && (
        <div id={id} className="flex items-center gap-2 font-medium text-kura-fg-muted text-xs">
          {label}
          <span className="font-kura-mono text-kura-fg-subtle tabular-nums">{sources.length}</span>
        </div>
      )}
      <ol
        aria-labelledby={label != null ? id : undefined}
        aria-label={label == null ? "Sources" : undefined}
        className={cn(
          variant === "strip"
            ? "-mx-1 -my-1 flex snap-x gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none]"
            : "flex flex-col gap-1",
        )}
      >
        {sources.map((source, i) => {
          const domain = sourceDomain(source.url);
          return (
            <li key={source.url + i} data-slot="citation-source" className="shrink-0 snap-start">
              {variant === "strip" ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-44 flex-col gap-1.5 rounded-kura-lg bg-kura-raised px-3 py-2.5 shadow-kura-raised outline-hidden transition-colors duration-(--kura-duration-fast) ease-kura-snap hover:bg-kura-raised-hover focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-kura-ring focus-visible:outline-offset-2"
                >
                  <span className="flex items-center gap-1.5 text-kura-fg-subtle text-xs">
                    <Favicon source={source} className="size-3.5" />
                    <span className="min-w-0 flex-1 truncate">{source.siteName ?? domain}</span>
                    <span className="tabular-nums">{i + 1}</span>
                  </span>
                  <span className="line-clamp-2 min-h-[2lh] font-medium text-[13px] text-kura-fg leading-snug">
                    {source.title}
                  </span>
                </a>
              ) : (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="-mx-2 flex gap-3 rounded-[9px] px-2 py-2 outline-hidden transition-colors duration-(--kura-duration-fast) ease-kura-snap hover:bg-kura-hover focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-kura-ring"
                >
                  <span className="w-4 shrink-0 pt-px text-right font-kura-mono text-kura-fg-subtle text-xs tabular-nums">
                    {i + 1}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate font-medium text-kura-fg text-sm">
                      {source.title}
                    </span>
                    <span className="flex items-center gap-1.5 text-kura-fg-subtle text-xs">
                      <Favicon source={source} className="size-3.5" />
                      <span className="truncate">{source.siteName ?? domain}</span>
                      {source.date && <span>· {source.date}</span>}
                    </span>
                    {source.snippet && (
                      <span className="line-clamp-2 pt-0.5 text-[13px] text-kura-fg-muted leading-relaxed">
                        {source.snippet}
                      </span>
                    )}
                  </span>
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
