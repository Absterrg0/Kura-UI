"use client";

import * as React from "react";
import { Attachment, AttachmentDropzone, AttachmentList } from "./attachment";
import { type AttachmentItem, createAttachment } from "./attachment-utils";

const photo = (a: number, b: number) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${a} 55% 78%)"/><stop offset="1" stop-color="hsl(${a + 20} 45% 90%)"/></linearGradient></defs><rect width="64" height="64" fill="url(#g)"/><circle cx="44" cy="20" r="7" fill="hsl(${b} 80% 92%)"/><path d="M0 46 L18 30 L32 42 L44 34 L64 50 V64 H0Z" fill="hsl(${b} 25% 38%)"/><path d="M0 54 L22 44 L40 52 L64 46 V64 H0Z" fill="hsl(${b} 20% 26%)"/></svg>`,
  )}`;

export function AttachmentMinimal() {
  return <Attachment name="q3-board-report.pdf" type="application/pdf" size={2_480_000} />;
}

const initial: AttachmentItem[] = [
  { id: "1", name: "brief.md", type: "text/markdown", size: 4_210 },
  { id: "2", name: "harbour.png", type: "image/png", size: 812_000, url: photo(205, 160) },
  {
    id: "3",
    name: "transactions.csv",
    type: "text/csv",
    size: 18_400_000,
    status: "uploading",
    progress: 0.18,
  },
  {
    id: "4",
    name: "schema.ts",
    type: "text/typescript",
    size: 9_800,
    status: "error",
    error: "Network connection lost",
  },
  { id: "5", name: "dunes.jpg", type: "image/jpeg", size: 1_200_000, url: photo(30, 25) },
  { id: "6", name: "interview.m4a", type: "audio/mp4", size: 6_300_000 },
  { id: "7", name: "notes.zip", type: "application/zip", size: 340_000 },
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

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
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
      <p className="text-kura-fg-subtle text-xs">
        Hover a file to remove it · Retry the failed upload · Open the +N stack
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
