"use client";

import * as React from "react";
import { Attachment, AttachmentDropzone, AttachmentList } from "./attachment";
import { type AttachmentItem, createAttachment, formatBytes } from "./attachment-utils";

/** Small ink-wash "photos" for the demo: paper, a vermilion sun and layered ink hills. */
const photo = (sun: number, ridge: number) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="hsl(42 38% 90%)"/><circle cx="${sun}" cy="20" r="8" fill="hsl(16 78% 56%)"/><path d="M0 ${ridge} L14 ${ridge - 12} L26 ${ridge - 4} L40 ${ridge - 16} L64 ${ridge - 2} V64 H0Z" fill="hsl(40 8% 62%)"/><path d="M0 ${ridge + 10} L20 ${ridge + 2} L36 ${ridge + 9} L64 ${ridge + 1} V64 H0Z" fill="hsl(40 10% 18%)"/></svg>`,
  )}`;

export function AttachmentMinimal() {
  return <Attachment name="q3-board-report.pdf" type="application/pdf" size={2_480_000} />;
}

const initial: AttachmentItem[] = [
  { id: "1", name: "launch-brief.md", type: "text/markdown", size: 4_210 },
  { id: "2", name: "kamakura-shrine.jpg", type: "image/jpeg", size: 812_000, url: photo(44, 44) },
  {
    id: "3",
    name: "orders-2025-q3.csv",
    type: "text/csv",
    size: 18_400_000,
    status: "uploading",
    progress: 0.18,
  },
  {
    id: "4",
    name: "billing-schema.ts",
    type: "text/typescript",
    size: 9_800,
    status: "error",
    error: "Network connection lost",
  },
  { id: "5", name: "harbour-dusk.jpg", type: "image/jpeg", size: 1_200_000, url: photo(18, 50) },
  { id: "6", name: "customer-call-0912.m4a", type: "audio/mp4", size: 6_300_000 },
  { id: "7", name: "design-review.zip", type: "application/zip", size: 340_000 },
];

export function AttachmentFull() {
  const [items, setItems] = React.useState(initial);

  // Simulate an upload ticking forward.
  React.useEffect(() => {
    const id = setInterval(() => {
      setItems((list) =>
        list.map((item) => {
          if (item.status !== "uploading") return item;
          const progress = Math.min(1, (item.progress ?? 0) + 0.07 + Math.random() * 0.06);
          return progress >= 1
            ? { ...item, status: "ready", progress: undefined }
            : { ...item, progress };
        }),
      );
    }, 450);
    return () => clearInterval(id);
  }, []);

  const total = items.reduce((sum, i) => sum + (i.size ?? 0), 0);

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3 px-0.5 font-kura-mono text-[10px] text-kura-fg-subtle uppercase tracking-[0.14em]">
        <span>Attached to this thread</span>
        <span className="tabular-nums">
          {items.length} files · {formatBytes(total)}
        </span>
      </div>
      <AttachmentList
        items={items}
        max={4}
        onRemove={(id) => setItems((list) => list.filter((i) => i.id !== id))}
        onRetry={(id) =>
          setItems((list) =>
            list.map((i) =>
              i.id === id ? { ...i, status: "uploading", progress: 0, error: undefined } : i,
            ),
          )
        }
      />
      <p className="border-kura-border-subtle border-t px-0.5 pt-3 text-kura-fg-subtle text-xs">
        Hover a file to remove it, retry the failed schema, or open the stack to see the rest.
      </p>
    </div>
  );
}

export function AttachmentWithDropzone() {
  const [items, setItems] = React.useState<AttachmentItem[]>([]);
  const [rejected, setRejected] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!items.some((i) => i.status === "uploading")) return;
    const id = setInterval(() => {
      setItems((list) =>
        list.map((i) => {
          if (i.status !== "uploading") return i;
          const progress = (i.progress ?? 0) + 0.2;
          return progress >= 1
            ? { ...i, status: "ready", progress: undefined }
            : { ...i, progress };
        }),
      );
    }, 300);
    return () => clearInterval(id);
  }, [items]);

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <AttachmentDropzone
        accept="image/*,.pdf,.csv,.md,.txt"
        maxSize={10 * 1024 * 1024}
        title="Drop the source files for this report"
        description="Images, PDF, CSV or Markdown · up to 10 MB"
        onFiles={(files, bad) => {
          setRejected(bad.length ? `${bad.map((f) => f.name).join(", ")} not supported` : null);
          setItems((list) => [
            ...list,
            ...files.map((f) => createAttachment(f, { status: "uploading", progress: 0 })),
          ]);
        }}
      />
      {rejected && (
        <p role="alert" className="text-kura-danger-text text-xs">
          {rejected}
        </p>
      )}
      {items.length > 0 && (
        <AttachmentList
          items={items}
          onRemove={(id) =>
            setItems((list) => {
              const gone = list.find((i) => i.id === id);
              if (gone?.url?.startsWith("blob:")) URL.revokeObjectURL(gone.url);
              return list.filter((i) => i.id !== id);
            })
          }
        />
      )}
    </div>
  );
}
