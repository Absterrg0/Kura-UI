"use client";

import * as React from "react";
import { RunHeader } from "../run-header";
import { type Checkpoint, Checkpoints } from "./checkpoints";

const sec = (s: number) => Date.now() - s * 1000;

export function CheckpointsMinimal() {
  const [checkpoints] = React.useState<Checkpoint[]>(() => [
    {
      id: "c3",
      label: "Patched src/middleware.ts",
      at: sec(70),
      filesChanged: 1,
      kind: "auto",
      current: true,
    },
    {
      id: "c2",
      label: "Replaced fetchUser() in 9 files",
      at: sec(260),
      filesChanged: 9,
      kind: "auto",
    },
    { id: "c1", label: "Run started on kura/auth-client", at: sec(690), kind: "auto" },
  ]);
  return <Checkpoints className="w-full max-w-md" checkpoints={checkpoints} onRestore={() => {}} />;
}

function storyline(): Checkpoint[] {
  return [
    {
      id: "tests",
      label: "Updated login and session tests",
      at: sec(150),
      filesChanged: 3,
      kind: "auto",
      current: true,
    },
    { id: "mw", label: "Patched src/middleware.ts", at: sec(290), filesChanged: 1, kind: "auto" },
    { id: "manual", label: "Before middleware changes", at: sec(370), kind: "manual" },
    {
      id: "client",
      label: "Replaced fetchUser() with auth.getSession()",
      at: sec(430),
      filesChanged: 9,
      kind: "auto",
    },
    { id: "start", label: "Run started on kura/auth-client", at: sec(720), kind: "auto" },
  ];
}

export function CheckpointsFull() {
  const [checkpoints, setCheckpoints] = React.useState<Checkpoint[]>(storyline);

  // The agent keeps working: a new automatic checkpoint lands a moment after mount.
  React.useEffect(() => {
    const t = setTimeout(() => {
      setCheckpoints((list) => [
        {
          id: "fix",
          label: "Fixed expired-session refresh in src/auth/client.ts",
          at: Date.now(),
          filesChanged: 1,
          kind: "auto",
          current: true,
        },
        ...list.map((c) => ({ ...c, current: false })),
      ]);
    }, 1800);
    return () => clearTimeout(t);
  }, []);

  const restore = (id: string) =>
    new Promise<void>((resolve) =>
      setTimeout(() => {
        setCheckpoints((list) => list.map((c) => ({ ...c, current: c.id === id })));
        resolve();
      }, 900),
    );

  const save = () =>
    setCheckpoints((list) => {
      const current = list.find((c) => c.current);
      return [
        {
          id: `manual-${list.length}`,
          label: current ? `Saved after “${current.label}”` : "Saved checkpoint",
          at: Date.now(),
          kind: "manual" as const,
          current: true,
        },
        ...list.map((c) => ({ ...c, current: false })),
      ];
    });

  return (
    <Checkpoints
      className="w-full max-w-lg"
      checkpoints={checkpoints}
      onRestore={restore}
      onCreate={save}
    />
  );
}

export function CheckpointsRestored() {
  const [checkpoints, setCheckpoints] = React.useState<Checkpoint[]>(() =>
    storyline().map((c) => ({ ...c, current: c.id === "manual" })),
  );
  return (
    <Checkpoints
      className="w-full max-w-lg"
      checkpoints={checkpoints}
      onRestore={(id) => setCheckpoints((l) => l.map((c) => ({ ...c, current: c.id === id })))}
    />
  );
}

export function CheckpointsEmpty() {
  return <Checkpoints className="w-full max-w-md" checkpoints={[]} />;
}

const STEP_OF: Record<string, number> = { tests: 5, mw: 4, manual: 3, client: 3, start: 0 };

export function CheckpointsComposition() {
  const [startedAt] = React.useState(() => sec(744));
  const [checkpoints, setCheckpoints] = React.useState<Checkpoint[]>(storyline);
  const current = checkpoints.find((c) => c.current)?.id ?? "tests";
  const rewound = current !== "tests";
  return (
    <div className="flex w-full max-w-xl flex-col gap-2">
      <RunHeader
        variant="bar"
        title="Migrate session API to @acme/auth"
        status={rewound ? "paused" : "running"}
        startedAt={startedAt}
        progress={{ done: STEP_OF[current] ?? 0, total: 7 }}
        cost={1.46}
        budget={5}
        onPause={() => {}}
        onResume={() => setCheckpoints((l) => l.map((c) => ({ ...c, current: c.id === "tests" })))}
        onStop={() => {}}
        shortcuts={false}
      />
      <Checkpoints
        checkpoints={checkpoints}
        onRestore={(id) => setCheckpoints((l) => l.map((c) => ({ ...c, current: c.id === id })))}
      />
    </div>
  );
}
