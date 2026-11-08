"use client";

import { Hand, Lock, Play } from "lucide-react";
import * as React from "react";
import { useElapsed } from "../../hooks/use-elapsed";
import { cn } from "../../lib/cn";
import { formatClock } from "../../lib/format";
import { Button } from "../button";
import { ShimmerText } from "../shimmer-text";
import { type AgentStatus, StatusGlyph } from "../status-glyph";

export type BrowserStepKind = "navigate" | "click" | "type" | "scroll" | "extract";

export interface BrowserStep {
  /** Stable key. */
  id: string;
  kind: BrowserStepKind;
  /** What the agent does, in words: "Click “Create pull request”". */
  label: React.ReactNode;
  status: AgentStatus;
  /** Machine detail in mono: the URL, the typed text, the selector, the extracted value. */
  detail?: React.ReactNode;
}

export interface BrowserPoint {
  /** Percent of the viewport width, 0–100. */
  x: number;
  /** Percent of the viewport height, 0–100. */
  y: number;
}

export interface BrowserHighlight extends BrowserPoint {
  /** Percent of the viewport width. */
  width: number;
  /** Percent of the viewport height. */
  height: number;
  /** Short tag over the box, e.g. `button "Create pull request"`. */
  label?: string;
}

export interface BrowserSessionProps extends Omit<React.ComponentProps<"div">, "title"> {
  /** The page URL shown in the address bar. */
  url: string;
  /** The page title shown next to the address bar. */
  title?: string;
  /** Viewport content: a live page, a mock rendered as markup, or anything else. */
  children?: React.ReactNode;
  /** A screenshot to show instead of `children`. */
  src?: string;
  /** Alt text for `src`. Default: "Screenshot of {url}". */
  alt?: string;
  /**
   * Design size of the page in CSS px (e.g. the agent's 1280×800 screen). `children` render at this
   * size and scale to fit, so coordinates stay stable at any width. Omit to let children flow.
   */
  viewport?: { width: number; height: number };
  /** Viewport aspect ratio when `viewport` is not given. Default 16 / 10. */
  aspectRatio?: number;
  /** Vertical scroll of the page in viewport px (with `viewport`) or CSS px. Eases on change. */
  scrollTop?: number;
  /** The agent's cursor, in % of the viewport. Glides between positions. */
  cursor?: BrowserPoint | null;
  /** Name tag on the cursor (e.g. the agent's name). */
  cursorLabel?: string;
  /** Change this to play a click ripple at the cursor. Default: the active step's id when it is a click. */
  clickKey?: string | number;
  /** Box around the element the agent is acting on, in % of the viewport. */
  highlight?: BrowserHighlight | null;
  /** The step log. Omit to hide the log. */
  steps?: readonly BrowserStep[];
  /** Id of the step being executed. Default: the first running step. */
  activeStep?: string;
  /** Session state. browsing (blue), paused for the human (amber), done, failed. Default "browsing". */
  status?: "browsing" | "paused" | "done" | "failed";
  /** Override the status line, e.g. "Paused — enter the 2FA code". */
  statusText?: React.ReactNode;
  /** Wall-clock start of the session, for the elapsed clock. */
  startedAt?: Date | number;
  /** Show the page-loading bar under the address bar. Default: the active step is a running navigate. */
  loading?: boolean;
  /** Extra controls in the status line, before Take over / Resume. */
  actions?: React.ReactNode;
  /** Shows "Take over" while browsing. */
  onTakeOver?: () => void;
  /** Shows "Resume agent" while paused. */
  onResume?: () => void;
  /** Step log beside the browser, below it, or beside only when the container is wide. Default "auto". */
  layout?: "auto" | "side" | "stacked";
}

const STATUS_GLYPH: Record<NonNullable<BrowserSessionProps["status"]>, AgentStatus> = {
  browsing: "running",
  paused: "waiting",
  done: "done",
  failed: "failed",
};

const STATUS_TEXT: Record<NonNullable<BrowserSessionProps["status"]>, string> = {
  browsing: "Agent is browsing",
  paused: "Paused for you",
  done: "Session ended",
  failed: "Session failed",
};

const STEP_SPOKEN: Record<AgentStatus, string> = {
  queued: "pending",
  running: "in progress",
  waiting: "waiting for you",
  done: "done",
  failed: "failed",
  skipped: "skipped",
  paused: "paused",
};

function splitUrl(url: string): { secure: boolean; host: string; rest: string } {
  const m = /^(https?:\/\/)?([^/?#]+)(.*)$/.exec(url);
  return {
    secure: !url.startsWith("http://"),
    host: m?.[2] ?? url,
    rest: m?.[3] ?? "",
  };
}

function useScale(ref: React.RefObject<HTMLDivElement | null>, width: number | undefined) {
  const [scale, setScale] = React.useState<number | null>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || !width) return;
    const update = () => setScale(el.clientWidth / width);
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, width]);
  return scale;
}

function Cursor({ point, label }: { point: BrowserPoint; label?: string }) {
  return (
    <span
      data-slot="browser-session-cursor"
      className="absolute z-30 transition-[left,top] duration-(--kura-duration-slower) ease-kura-in-out motion-reduce:transition-none"
      style={{ left: `${point.x}%`, top: `${point.y}%` }}
    >
      <svg
        aria-hidden
        width="16"
        height="20"
        viewBox="0 0 16 20"
        className="-translate-x-[2px] -translate-y-[1px] drop-shadow-[0_1px_1.5px_oklch(0_0_0/0.25)]"
      >
        <path
          d="M1.5 1.5v14.2l3.7-3.5 2.5 5.8 2.5-1.1-2.4-5.6h5.2L1.5 1.5Z"
          className="fill-kura-fg stroke-kura-surface"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
      </svg>
      {label && (
        <span className="absolute top-[15px] left-[11px] whitespace-nowrap rounded-[5px] bg-kura-accent px-1.5 py-px font-medium text-[10.5px] text-kura-accent-fg leading-4 shadow-kura-xs">
          {label}
        </span>
      )}
    </span>
  );
}

/** One click ripple; replays when its key changes. Waits for the cursor to arrive. */
function Ripple({ point }: { point: BrowserPoint }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof el.animate !== "function") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const animation = el.animate(
      [
        { transform: "translate(-50%, -50%) scale(0.2)", opacity: 1 },
        { transform: "translate(-50%, -50%) scale(1)", opacity: 0 },
      ],
      { duration: 700, delay: 420, easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "forwards" },
    );
    return () => animation.cancel();
  }, []);
  return (
    <span
      ref={ref}
      data-slot="browser-session-ripple"
      className="absolute z-20 size-10 rounded-full border-2 border-kura-accent opacity-0"
      style={{ left: `${point.x}%`, top: `${point.y}%`, transform: "translate(-50%, -50%)" }}
    />
  );
}

function StepRow({ step, active }: { step: BrowserStep; active: boolean }) {
  return (
    <li
      data-slot="browser-session-step"
      data-kind={step.kind}
      data-status={step.status}
      data-active={active || undefined}
      aria-current={active ? "step" : undefined}
      className={cn(
        "relative flex items-start gap-2.5 border-kura-border-subtle border-t px-3.5 py-2 first:border-t-0",
        "transition-[opacity,translate,background-color] duration-(--kura-duration-base) ease-kura-out starting:translate-y-[2px] starting:opacity-0 motion-reduce:starting:translate-y-0",
        active && "bg-kura-hover",
      )}
    >
      <span className="flex h-5 shrink-0 items-center">
        <StatusGlyph status={step.status} size="sm" label={null} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            "text-[13px] leading-5",
            step.status === "queued" ? "text-kura-fg-muted" : "text-kura-fg",
            step.status === "running" && "font-medium",
            step.status === "skipped" && "text-kura-fg-subtle line-through",
          )}
        >
          {step.status === "running" ? (
            <ShimmerText duration={2.4}>{step.label}</ShimmerText>
          ) : (
            step.label
          )}
          <span className="sr-only"> ({STEP_SPOKEN[step.status]})</span>
        </span>
        {step.detail != null && (
          <span
            className={cn(
              "truncate font-kura-mono text-[11.5px] leading-4",
              step.status === "failed" ? "text-kura-danger-text" : "text-kura-fg-subtle",
            )}
          >
            {step.detail}
          </span>
        )}
      </span>
      <span className="flex h-5 shrink-0 items-center font-kura-mono text-[11px] text-kura-fg-subtle">
        {step.kind}
      </span>
    </li>
  );
}

/**
 * A computer-use / browser-use session made legible: a tidy browser frame (title + address bar with
 * lock), the page itself (your markup or a screenshot, optionally at a fixed design size that scales
 * to fit), an action overlay (the agent's cursor gliding between targets, a click ripple, a box around
 * the target element) and a step log of navigate / click / type / scroll / extract actions, with a
 * status line and take-over / resume controls.
 */
export function BrowserSession({
  url,
  title,
  children,
  src,
  alt,
  viewport,
  aspectRatio = 16 / 10,
  scrollTop = 0,
  cursor,
  cursorLabel,
  clickKey,
  highlight,
  steps,
  activeStep,
  status = "browsing",
  statusText,
  startedAt,
  loading,
  actions,
  onTakeOver,
  onResume,
  layout = "auto",
  className,
  ...props
}: BrowserSessionProps) {
  const frameRef = React.useRef<HTMLDivElement>(null);
  const logRef = React.useRef<HTMLOListElement>(null);
  const scale = useScale(frameRef, viewport?.width);
  const elapsed = useElapsed(startedAt, status === "browsing", 1000);

  const active =
    steps?.find((s) => s.id === activeStep) ?? steps?.find((s) => s.status === "running");
  const ripple = clickKey ?? (active?.kind === "click" ? active.id : undefined);
  const isLoading = loading ?? (active?.kind === "navigate" && active.status === "running");
  const done = steps?.filter((s) => s.status === "done" || s.status === "skipped").length ?? 0;
  const { secure, host, rest } = splitUrl(url);
  const ratio = viewport ? viewport.width / viewport.height : aspectRatio;

  // Keep the active step in view inside the log (without scrolling the page).
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run when the active step changes
  React.useEffect(() => {
    const list = logRef.current;
    const scroller = list?.parentElement;
    const row = list?.querySelector<HTMLElement>("[data-active]");
    if (!scroller || !row) return;
    const top = row.offsetTop - list.offsetTop;
    if (
      top < scroller.scrollTop ||
      top + row.offsetHeight > scroller.scrollTop + scroller.clientHeight
    )
      scroller.scrollTop = top - scroller.clientHeight / 2 + row.offsetHeight / 2;
  }, [active?.id]);

  const announcement =
    status === "paused"
      ? typeof statusText === "string"
        ? statusText
        : "Paused for you"
      : status === "done"
        ? "Session ended"
        : status === "failed"
          ? "Session failed"
          : typeof active?.label === "string"
            ? active.label
            : "";

  const side = layout === "side";
  const auto = layout === "auto";

  return (
    <div
      data-slot="browser-session"
      data-status={status}
      data-layout={layout}
      className={cn(
        "@container flex min-w-0 flex-col overflow-hidden rounded-kura-xl bg-kura-surface font-kura-sans text-kura-fg shadow-kura-sm",
        className,
      )}
      {...props}
    >
      {/* Status line */}
      <div
        data-slot="browser-session-header"
        className="flex h-10 shrink-0 items-center gap-2.5 border-kura-border-subtle border-b px-3.5"
      >
        <StatusGlyph status={STATUS_GLYPH[status]} size="sm" label={null} />
        <span className="flex min-w-0 items-baseline gap-2 text-[13px]">
          <span
            className={cn(
              "min-w-0 truncate font-medium @md:shrink-0",
              status === "paused" && "text-kura-warning-text",
            )}
          >
            {status === "browsing" ? (
              <ShimmerText duration={2.4}>{STATUS_TEXT.browsing}</ShimmerText>
            ) : (
              STATUS_TEXT[status]
            )}
          </span>
          {statusText != null && (
            <span className="hidden min-w-0 truncate text-kura-fg-subtle @md:inline">
              {statusText}
            </span>
          )}
        </span>
        <span className="flex-1" />
        {steps && steps.length > 0 && (
          <span className="hidden whitespace-nowrap font-kura-mono text-[12px] text-kura-fg-subtle tabular-nums @md:inline">
            {done}/{steps.length}
          </span>
        )}
        {elapsed != null && (
          <span
            data-slot="browser-session-elapsed"
            className="min-w-[4.5ch] text-right font-kura-mono text-[12px] text-kura-fg-subtle tabular-nums"
          >
            {formatClock(elapsed)}
          </span>
        )}
        {actions}
        {status === "browsing" && onTakeOver && (
          <Button variant="outline" size="xs" onClick={onTakeOver} className="-mr-1">
            <Hand strokeWidth={1.75} /> Take over
          </Button>
        )}
        {status === "paused" && onResume && (
          <Button variant="primary" size="xs" onClick={onResume} className="-mr-1">
            <Play strokeWidth={1.75} /> Resume agent
          </Button>
        )}
      </div>

      <div
        className={cn(
          "grid min-w-0",
          side && "grid-cols-[minmax(0,1fr)_minmax(220px,34%)]",
          auto && steps && "@3xl:grid-cols-[minmax(0,1fr)_minmax(240px,32%)]",
        )}
      >
        {/* Browser */}
        <div data-slot="browser-session-browser" className="flex min-w-0 flex-col">
          <div
            data-slot="browser-session-chrome"
            className="relative flex h-10 shrink-0 items-center gap-2.5 border-kura-border-subtle border-b px-2.5"
          >
            {title && (
              <span className="hidden max-w-[34%] min-w-0 items-center gap-2 pl-1 @lg:flex">
                <span
                  aria-hidden
                  className="grid size-4 shrink-0 place-items-center rounded-[4px] bg-kura-fg font-semibold text-[9px] text-kura-fg-inverted"
                >
                  {host
                    .replace(/^www\./, "")
                    .charAt(0)
                    .toUpperCase()}
                </span>
                <span className="truncate font-medium text-[12.5px]">{title}</span>
              </span>
            )}
            {/* biome-ignore lint/a11y/useSemanticElements: a fieldset would add form semantics to a read-only address */}
            <div
              data-slot="browser-session-address"
              role="group"
              aria-label="Address"
              className="flex h-7 min-w-0 flex-1 items-center gap-1.5 rounded-kura-md bg-kura-surface-sunken px-2.5 shadow-[inset_0_0_0_1px_var(--kura-border-subtle)]"
            >
              {secure && (
                <Lock
                  aria-label="Secure connection"
                  strokeWidth={2}
                  className="size-3 shrink-0 text-kura-fg-subtle"
                />
              )}
              <span className="min-w-0 truncate font-kura-mono text-[12px]">
                <span className="text-kura-fg">{host}</span>
                <span className="text-kura-fg-subtle">{rest}</span>
              </span>
            </div>
            {isLoading && (
              <span
                data-slot="browser-session-loading"
                aria-hidden
                className="absolute inset-x-0 -bottom-px h-[2px] animate-kura-shimmer bg-[length:250%_100%] bg-[linear-gradient(90deg,transparent_30%,var(--kura-accent)_50%,transparent_70%)] motion-reduce:animate-none motion-reduce:bg-kura-accent/40"
              />
            )}
          </div>

          {/* Viewport */}
          <div
            ref={frameRef}
            data-slot="browser-session-viewport"
            className={cn(
              "relative w-full overflow-hidden bg-kura-canvas",
              status === "paused" &&
                "after:pointer-events-none after:absolute after:inset-0 after:z-40 after:shadow-[inset_0_0_0_2px_var(--kura-warning)]",
            )}
            style={{ aspectRatio: ratio }}
          >
            <div
              data-slot="browser-session-page"
              className={cn(
                "absolute top-0 left-0 transition-transform duration-(--kura-duration-slower) ease-kura-in-out motion-reduce:transition-none",
                !viewport && "inset-x-0",
                viewport && scale == null && "opacity-0",
              )}
              style={
                viewport
                  ? {
                      width: viewport.width,
                      transformOrigin: "0 0",
                      transform: `scale(${scale ?? 1}) translateY(${-scrollTop}px)`,
                    }
                  : { transform: `translateY(${-scrollTop}px)` }
              }
            >
              {src ? (
                <img
                  src={src}
                  alt={alt ?? `Screenshot of ${url}`}
                  className="block h-auto w-full"
                  draggable={false}
                />
              ) : (
                children
              )}
            </div>

            <div
              data-slot="browser-session-overlay"
              aria-hidden
              className="pointer-events-none absolute inset-0 z-20"
            >
              {highlight && (
                <span
                  data-slot="browser-session-highlight"
                  className="absolute rounded-[5px] bg-kura-accent/[0.06] shadow-[0_0_0_1.5px_var(--kura-accent)] transition-[left,top,width,height,opacity] duration-(--kura-duration-slow) ease-kura-out starting:opacity-0 motion-reduce:transition-opacity"
                  style={{
                    left: `${highlight.x}%`,
                    top: `${highlight.y}%`,
                    width: `${highlight.width}%`,
                    height: `${highlight.height}%`,
                  }}
                >
                  {highlight.label && (
                    <span className="absolute bottom-full left-[-1.5px] mb-1 max-w-[240px] truncate whitespace-nowrap rounded-[4px] bg-kura-accent px-1.5 font-kura-mono text-[10.5px] text-kura-accent-fg leading-4">
                      {highlight.label}
                    </span>
                  )}
                </span>
              )}
              {cursor && ripple != null && <Ripple key={String(ripple)} point={cursor} />}
              {cursor && <Cursor point={cursor} label={cursorLabel} />}
            </div>
          </div>
        </div>

        {/* Step log */}
        {steps && (
          <div
            data-slot="browser-session-log"
            className={cn(
              "relative min-w-0 border-kura-border-subtle",
              side ? "border-l" : "border-t",
              auto && "@3xl:border-t-0 @3xl:border-l",
            )}
          >
            <div
              className={cn(
                "overflow-y-auto overscroll-contain",
                side && "absolute inset-0",
                !side && "max-h-56",
                auto && "@3xl:absolute @3xl:inset-0 @3xl:max-h-none",
              )}
            >
              <ol ref={logRef} aria-label="Browser actions" className="flex flex-col">
                {steps.map((step) => (
                  <StepRow key={step.id} step={step} active={step.id === active?.id} />
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
