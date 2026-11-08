"use client";

import { Check, FileText, FolderGit2, HardDrive, ListTodo, TriangleAlert } from "lucide-react";
import * as React from "react";
import { Button } from "../button";
import { Spinner } from "./spinner";

export function SpinnerMinimal() {
  return <Spinner />;
}

export function SpinnerFull() {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-end gap-8 text-kura-fg">
        {(["sm", "md", "lg"] as const).map((size) => (
          <span key={size} className="flex flex-col items-center gap-2.5">
            <Spinner size={size} label={`Loading, ${size}`} />
            <span className="font-kura-mono text-[10px] text-kura-fg-subtle uppercase tracking-[0.14em]">
              {size}
            </span>
          </span>
        ))}
        <span className="flex flex-col items-center gap-2.5">
          <Spinner size="lg" label="Model is working" className="text-kura-accent" />
          <span className="font-kura-mono text-[10px] text-kura-fg-subtle uppercase tracking-[0.14em]">
            shu
          </span>
        </span>
      </div>
      <span className="inline-flex items-center gap-2 text-kura-fg-muted text-sm">
        <Spinner size="sm" label={null} /> Fetching models…
      </span>
    </div>
  );
}

type SourceStatus = "synced" | "syncing" | "error";

const initialSources: Array<{
  id: string;
  name: string;
  detail: string;
  icon: React.ReactNode;
  status: SourceStatus;
}> = [
  {
    id: "drive",
    name: "Product specs",
    detail: "Drive · 1,204 files",
    icon: <HardDrive />,
    status: "synced",
  },
  {
    id: "wiki",
    name: "Team wiki",
    detail: "Notion · 386 pages",
    icon: <FileText />,
    status: "syncing",
  },
  {
    id: "repo",
    name: "kura-ui/kura",
    detail: "GitHub · main",
    icon: <FolderGit2 />,
    status: "synced",
  },
  {
    id: "issues",
    name: "Roadmap issues",
    detail: "Linear · access expired",
    icon: <ListTodo />,
    status: "error",
  },
];

export function SpinnerSourcesList() {
  const [sources, setSources] = React.useState(initialSources);
  const [syncingAll, setSyncingAll] = React.useState(false);
  const syncing = sources.some((s) => s.status === "syncing");
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  React.useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Let the initial "Team wiki" sync finish so the demo settles.
  React.useEffect(() => {
    const id = setTimeout(
      () => setSources((all) => all.map((s) => (s.id === "wiki" ? { ...s, status: "synced" } : s))),
      3200,
    );
    return () => clearTimeout(id);
  }, []);

  const settle = (id: string, ms: number) =>
    timers.current.push(
      setTimeout(
        () => setSources((all) => all.map((s) => (s.id === id ? { ...s, status: "synced" } : s))),
        ms,
      ),
    );
  const syncOne = (id: string) => {
    setSources((all) => all.map((s) => (s.id === id ? { ...s, status: "syncing" } : s)));
    settle(id, 1800);
  };
  // Re-index healthy sources; one that needs reconnecting stays put until the user acts.
  const syncAll = () => {
    const healthy = sources.filter((s) => s.status !== "error");
    setSources((all) => all.map((s) => (s.status === "error" ? s : { ...s, status: "syncing" })));
    for (const [i, s] of healthy.entries()) settle(s.id, 900 + i * 650);
    setSyncingAll(true);
    timers.current.push(setTimeout(() => setSyncingAll(false), 900 + healthy.length * 650));
  };

  return (
    <section
      aria-labelledby="sources-title"
      className="flex w-full max-w-md flex-col rounded-kura-md bg-kura-surface shadow-kura-sm"
    >
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
        <div className="flex flex-col gap-1">
          <h3
            id="sources-title"
            className="font-kura-display text-[19px] text-kura-fg leading-tight"
          >
            Knowledge sources
          </h3>
          <p className="text-kura-fg-muted text-xs" aria-live="polite">
            {syncing ? "Syncing — answers may miss recent changes" : "Indexed 2 minutes ago"}
          </p>
        </div>
        <Button variant="secondary" size="sm" loading={syncingAll} onClick={syncAll}>
          Sync now
        </Button>
      </div>
      <ul className="mx-5 mb-2 flex flex-col divide-y divide-kura-border-subtle border-kura-border border-t">
        {sources.map((source) => (
          <li
            key={source.id}
            data-status={source.status}
            className="flex items-center gap-3 py-2.5"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-kura-sm bg-kura-surface-sunken text-kura-fg-muted [&_svg]:size-4 [&_svg]:stroke-[1.75]">
              {source.icon}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium text-[13px] text-kura-fg">{source.name}</span>
              <span className="truncate font-kura-mono text-[11px] text-kura-fg-subtle">
                {source.detail}
              </span>
            </span>
            {source.status === "error" ? (
              <Button
                variant="outline"
                size="xs"
                aria-label={`Reconnect ${source.name}`}
                onClick={() => syncOne(source.id)}
              >
                <TriangleAlert className="text-kura-danger-text" />
                Reconnect
              </Button>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1.5 text-kura-fg-muted text-xs">
                {source.status === "syncing" ? (
                  <Spinner size="sm" label={null} />
                ) : (
                  <Check aria-hidden className="size-3.5 text-kura-success-text" />
                )}
                {source.status === "syncing" ? "Indexing…" : "Up to date"}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
