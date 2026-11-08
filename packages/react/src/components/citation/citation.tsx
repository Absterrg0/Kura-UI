"use client";

import { ArrowUpRight } from "lucide-react";
import * as React from "react";
import { useControllableState } from "../../hooks/use-controllable-state";
import { cn } from "../../lib/cn";
import { Popover, PopoverAnchor, PopoverContent } from "../popover";

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

function isFocusVisible(el: Element): boolean {
  try {
    return el.matches(":focus-visible");
  } catch {
    return true;
  }
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
  const domain = sourceDomain(source.url);
  return (
    <span
      aria-hidden
      data-slot="citation-favicon"
      className={cn(
        "grid size-4 shrink-0 place-items-center overflow-hidden rounded-kura-xs bg-kura-surface-raised font-kura-mono font-medium text-[9px] text-kura-fg-muted uppercase shadow-[0_0_0_1px_var(--kura-border)]",
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
        (source.siteName ?? domain).charAt(0)
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
      className={cn("flex flex-col gap-2 font-kura-sans", className)}
      {...props}
    >
      <div className="flex items-center gap-2 font-kura-mono text-[11px] text-kura-fg-subtle tracking-[0.02em]">
        <Favicon source={source} />
        <span className="min-w-0 flex-1 truncate">
          {source.siteName ?? domain}
          {source.date && <span> · {source.date}</span>}
        </span>
        {index != null && (
          <span className="grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] tabular-nums shadow-[inset_0_0_0_1px_var(--kura-border-strong)]">
            {index}
          </span>
        )}
      </div>
      <a
        href={source.url}
        target="_blank"
        rel="noreferrer"
        className="group/title -mx-1 line-clamp-2 rounded-kura-xs px-1 font-kura-display text-[17px] text-kura-fg leading-[1.3] outline-none hover:underline hover:decoration-kura-border-strong hover:decoration-1 hover:underline-offset-[3px] focus-visible:shadow-kura-focus"
      >
        {source.title}
        <ArrowUpRight
          aria-hidden
          className="ml-0.5 inline size-3.5 align-[-2px] text-kura-fg-subtle transition-transform duration-(--kura-duration-fast) ease-kura-out group-hover/title:translate-x-px group-hover/title:-translate-y-px motion-reduce:transition-none"
        />
      </a>
      {source.snippet && (
        <p className="line-clamp-3 border-kura-border-strong border-l pl-3 text-[13px] text-kura-fg-muted leading-relaxed">
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
  /** 1-based citation number shown in the pill. */
  index: number;
  /** The cited source. */
  source: CitationSource;
  /** Pill label: the number (default) or the source's domain/site name. */
  display?: "number" | "domain";
  /** Hover delay before the preview opens, in ms. Default 250. */
  openDelay?: number;
  /** Preview open (controlled). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Inline numbered citation pill. It is a real link to the source; hovering or keyboard-focusing
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
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  ...props
}: CitationProps) {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: false,
    onChange: onOpenChange,
  });
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  const schedule = (next: boolean, delay: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(next), delay);
  };
  const domain = sourceDomain(source.url);
  const label = display === "domain" ? (source.siteName ?? domain) : String(index);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer"
          data-slot="citation"
          data-state={open ? "open" : "closed"}
          aria-label={`Source ${index}: ${source.title} (${domain})`}
          onPointerEnter={(e) => {
            onPointerEnter?.(e);
            if (e.pointerType !== "touch") schedule(true, openDelay);
          }}
          onPointerLeave={(e) => {
            onPointerLeave?.(e);
            schedule(false, 150);
          }}
          onFocus={(e) => {
            onFocus?.(e);
            if (isFocusVisible(e.currentTarget)) schedule(true, 0);
          }}
          onBlur={(e) => {
            onBlur?.(e);
            schedule(false, 100);
          }}
          className={cn(
            "relative -top-[0.1em] mr-px ml-1 inline-flex h-[1.35em] min-w-[1.35em] items-center justify-center gap-1 rounded-full px-[0.42em] align-middle font-kura-mono font-medium text-[0.7em] text-kura-fg-muted tabular-nums leading-none no-underline shadow-[inset_0_0_0_1px_var(--kura-border-strong)] outline-none",
            // Hover lifts it onto the page; open inks it in, like a footnote mark that has been pressed.
            "transition-[background-color,color,box-shadow] duration-(--kura-duration-fast) ease-kura-out hover:bg-kura-hover hover:text-kura-fg focus-visible:shadow-kura-focus data-[state=open]:bg-kura-ink data-[state=open]:text-kura-fg-inverted data-[state=open]:shadow-none",
            className,
          )}
          {...props}
        >
          {display === "domain" && (
            <Favicon source={source} className="-ml-0.5 size-[1.15em] rounded-full" />
          )}
          {label}
        </a>
      </PopoverAnchor>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={6}
        data-slot="citation-preview"
        className="w-80 p-4"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onPointerEnter={() => clearTimeout(timer.current)}
        onPointerLeave={() => schedule(false, 150)}
      >
        <CitationCard source={source} index={index} />
      </PopoverContent>
    </Popover>
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
        <div
          id={id}
          className="flex items-center gap-2 font-kura-mono text-[10px] text-kura-fg-subtle uppercase tracking-[0.14em]"
        >
          {label}
          <span className="tabular-nums">· {sources.length}</span>
        </div>
      )}
      <ol
        aria-labelledby={label != null ? id : undefined}
        aria-label={label == null ? "Sources" : undefined}
        className={cn(
          variant === "strip"
            ? "-mx-1 -my-1 flex snap-x gap-2 overflow-x-auto px-1 py-1 [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] [scrollbar-width:none]"
            : "flex flex-col divide-y divide-kura-border-subtle shadow-[inset_0_1px_0_var(--kura-border-subtle),inset_0_-1px_0_var(--kura-border-subtle)]",
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
                  className="flex w-52 flex-col gap-2 rounded-kura-md bg-kura-surface p-3 shadow-kura-xs outline-none transition-[background-color,box-shadow] duration-(--kura-duration-fast) ease-kura-out hover:bg-kura-surface-raised hover:shadow-kura-sm focus-visible:shadow-kura-focus"
                >
                  <span className="line-clamp-2 min-h-[2lh] text-[13px] text-kura-fg leading-snug">
                    {source.title}
                  </span>
                  <span className="flex items-center gap-1.5 font-kura-mono text-[11px] text-kura-fg-subtle">
                    <Favicon source={source} className="size-3.5" />
                    <span className="min-w-0 flex-1 truncate">{source.siteName ?? domain}</span>
                    <span className="tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  </span>
                </a>
              ) : (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group/source flex gap-4 px-1 py-3 outline-none transition-colors duration-(--kura-duration-fast) ease-kura-out hover:bg-kura-hover focus-visible:shadow-kura-focus"
                >
                  <span className="w-5 shrink-0 pt-[3px] font-kura-mono text-[11px] text-kura-fg-subtle tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate font-medium text-kura-fg text-sm group-hover/source:underline group-hover/source:decoration-kura-border-strong group-hover/source:underline-offset-[3px]">
                      {source.title}
                    </span>
                    <span className="flex items-center gap-1.5 font-kura-mono text-[11px] text-kura-fg-subtle">
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
