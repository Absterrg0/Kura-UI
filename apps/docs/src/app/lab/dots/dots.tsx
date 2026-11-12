"use client";

import { Square } from "lucide-react";
import * as React from "react";
import "./dots.css";

/* ───────────────────────── The dot primitives ───────────────────────── */

type State = "queued" | "running" | "waiting" | "done" | "failed";

// 5×5 patterns, row by row.
const PATTERN: Record<Exclude<State, "running">, string[]> = {
  queued: ["01110", "10001", "10001", "10001", "01110"],
  waiting: ["01110", "10001", "10101", "10001", "01110"],
  done: ["01110", "11111", "11111", "11111", "01110"],
  failed: ["10001", "01010", "00100", "01010", "10001"],
};
// The ring, clockwise from the top: the path the running light travels.
// biome-ignore format: a 5×5 ring reads better on two lines
const RING: [number, number][] = [
  [1, 0], [2, 0], [3, 0], [4, 1], [4, 2], [4, 3],
  [3, 4], [2, 4], [1, 4], [0, 3], [0, 2], [0, 1],
];

/** State as a 5×5 dot matrix. Unlit dots stay faintly visible; running chases round the ring. */
function DotGlyph({ state, size = 15 }: { state: State; size?: number }) {
  const dots: React.ReactNode[] = [];
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      const cx = 1.5 + x * 3;
      const cy = 1.5 + y * 3;
      const key = `${x}-${y}`;
      if (state === "running") {
        const i = RING.findIndex(([rx, ry]) => rx === x && ry === y);
        dots.push(
          <circle
            key={key}
            cx={cx}
            cy={cy}
            r={1.1}
            data-chase={i >= 0 ? "" : undefined}
            style={i >= 0 ? ({ "--i": i } as React.CSSProperties) : undefined}
          />,
        );
      } else {
        const on = PATTERN[state][y]?.[x] === "1";
        const centre = state === "waiting" && x === 2 && y === 2;
        dots.push(
          <circle
            key={key}
            cx={cx}
            cy={cy}
            r={1.1}
            data-on={on ? "" : undefined}
            data-blink={centre ? "" : undefined}
          />,
        );
      }
    }
  }
  return (
    <svg
      className="kd-glyph"
      data-state={state}
      viewBox="0 0 15 15"
      width={size}
      height={size}
      aria-hidden
    >
      {dots}
    </svg>
  );
}

/** A face for an agent: a symmetric 5×5 sigil generated from its name. Same name, same face. */
function Sigil({ name, small }: { name: string; small?: boolean }) {
  const bits = React.useMemo(() => {
    let h = 2166136261;
    for (const ch of name) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    const cells: boolean[] = [];
    for (let i = 0; i < 15; i++) {
      h = Math.imul(h ^ (h >>> 13), 1274126177);
      cells.push(((h >>> 16) & 3) !== 0 ? (h & 1) === 1 || i % 4 === 0 : false);
    }
    return cells;
  }, [name]);
  const dots: React.ReactNode[] = [];
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      const col = x < 3 ? x : 4 - x;
      dots.push(
        <circle
          key={`${x}-${y}`}
          cx={1.5 + x * 3}
          cy={1.5 + y * 3}
          r={1.15}
          data-on={bits[y * 3 + col] ? "" : undefined}
        />,
      );
    }
  }
  const px = small ? 12 : 16;
  return (
    <span className={small ? "kd-sigil sm" : "kd-sigil"} aria-hidden>
      <svg viewBox="0 0 15 15" width={px} height={px}>
        {dots}
      </svg>
    </span>
  );
}

/** Progress as a row of dots; `live` pulses the leading dot. */
function Rail({ value, color, live }: { value: number; color?: string; live?: boolean }) {
  return (
    <div
      className="kd-rail"
      style={{ "--p": `${Math.round(value * 100)}%`, "--c": color } as React.CSSProperties}
    >
      <i />
      {live && <b />}
    </div>
  );
}

/** One span on the shared time axis: a run of lit dots from `start` for `width` (0–1). */
function Span({
  label,
  start,
  width,
  duration,
  color,
  live,
}: {
  label: string;
  start: number;
  width: number;
  duration: string;
  color?: string;
  live?: boolean;
}) {
  return (
    <div className="kd-span mono">
      <span className="l">{label}</span>
      <div
        className="kd-rail"
        style={
          {
            "--s": `${start * 100}%`,
            "--w": `${width * 100}%`,
            "--c": color,
          } as React.CSSProperties
        }
      >
        <i />
        {live && <b />}
      </div>
      <span className="d">{duration}</span>
    </div>
  );
}

/* ───────────────────────── The scene ───────────────────────── */

type Decision = "pending" | "approved" | "denied";

const clock = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

const MIGRATE = [
  ["dim", "migrate 20261112_session_refresh_hash"],
  ["ok", "✓ add column sessions.refresh_token_hash", " 12ms"],
  ["ok", "✓ create index sessions_refresh_hash_idx", " 1.2s"],
  ["ok", "✓ backfill 48,210 rows", " 3.8s"],
  ["dim", "done in 5.1s"],
] as const;

const CONTEXT = [
  ["System prompt", 7, "14.2k"],
  ["Conversation", 31, "61.8k"],
  ["Tool results", 19, "38.4k"],
  ["Files", 9, "17.6k"],
] as const;

export function Dots({ theme = "dark" }: { theme?: "dark" | "light" }) {
  const [decision, setDecision] = React.useState<Decision>("pending");
  const [now, setNow] = React.useState<number | null>(null);
  const [t0] = React.useState(() => Date.now());
  const [streamed, setStreamed] = React.useState(0);

  React.useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Approving starts the migration: the terminal streams and the plan moves on.
  React.useEffect(() => {
    if (decision !== "approved") {
      setStreamed(0);
      return;
    }
    const id = setInterval(() => setStreamed((n) => Math.min(MIGRATE.length, n + 1)), 620);
    return () => clearInterval(id);
  }, [decision]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
        setDecision((d) => (d === "pending" ? "approved" : d));
      else if (e.key === "Escape") setDecision((d) => (d === "pending" ? "denied" : d));
      else if (e.key === "r" && !e.metaKey && !e.ctrlKey) setDecision("pending");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const elapsed = now == null ? 0 : now - t0;
  const pending = decision === "pending";
  const migrated = streamed >= MIGRATE.length;
  const migrateState: State = pending
    ? "waiting"
    : decision === "denied"
      ? "failed"
      : migrated
        ? "done"
        : "running";
  const runState: State = pending ? "waiting" : "running";

  const plan: { title: string; state: State; meta: string }[] = [
    { title: "Map call sites of fetchUser()", state: "done", meta: "1m 36s" },
    { title: "Patch src/auth/client.ts", state: "done", meta: "1m 14s" },
    { title: "Run the auth test suite", state: "done", meta: "18s" },
    {
      title: "Migrate the sessions table",
      state: migrateState,
      meta: pending
        ? "Needs you"
        : decision === "denied"
          ? "Denied"
          : migrated
            ? "5.1s"
            : clock(streamed * 620),
    },
    {
      title: "Deploy a preview",
      state: decision === "denied" || migrated ? "running" : "queued",
      meta: decision === "denied" || migrated ? clock(elapsed % 60000) : "",
    },
    { title: "Open a pull request", state: "queued", meta: "" },
  ];
  const done = plan.filter((p) => p.state === "done").length;
  const progress = (done + (plan.some((p) => p.state === "running") ? 0.5 : 0)) / plan.length;

  const agents: {
    name: string;
    activity: string;
    state: State;
    progress?: number;
    time: string;
  }[] = [
    {
      name: "explorer",
      activity: "Found 23 calls to fetchUser() in 9 files",
      state: "done",
      time: "1:36",
    },
    {
      name: "test-writer",
      activity: "Adding a fixture for expired sessions",
      state: "running",
      progress: 0.62,
      time: clock(94_000 + elapsed),
    },
    {
      name: "migrator",
      activity: pending
        ? "Waiting for your approval"
        : decision === "denied"
          ? "Told no. Nothing ran"
          : migrated
            ? "Backfilled 48,210 rows"
            : "Running the migration",
      state: migrateState,
      progress: decision === "approved" && !migrated ? streamed / MIGRATE.length : undefined,
      time: pending ? "" : migrated ? "0:05" : "",
    },
  ];

  let used = 0;
  const matrix: (number | undefined)[] = [];
  CONTEXT.forEach(([, n], s) => {
    for (let i = 0; i < n; i++) matrix[used++] = s;
  });

  return (
    <div className="kd" data-theme={theme}>
      <div className="kd-frame">
        {/* Run header */}
        <header className="kd-sheet kd-run">
          <div className="who">
            <Sigil name="Kura" />
            <div style={{ minWidth: 0 }}>
              <h1>Migrate session API to @acme/auth</h1>
              <div className="sub mono">
                <span>kura/auth-client</span>
                <span>claude-opus-5-5</span>
              </div>
            </div>
          </div>
          <div className="stats">
            <span className="kd-state" data-state={runState}>
              <DotGlyph state={runState} />
              {pending ? "Needs you" : "Running"}
            </span>
            <div className="kd-stat">
              <b className="mono">{clock(7 * 60_000 + 19_000 + elapsed)}</b>
              <span>elapsed</span>
            </div>
            <div className="kd-stat">
              <b className="mono">339k</b>
              <span>tokens</span>
            </div>
            <div className="kd-stat">
              <b className="mono">$1.63</b>
              <span>of $5.00</span>
            </div>
            <button type="button" className="kd-btn kd-icon" aria-label="Stop run">
              <Square size={12} strokeWidth={2.5} fill="currentColor" />
            </button>
          </div>
          <Rail value={progress} color={pending ? "var(--ember)" : undefined} live />
        </header>

        <div className="kd-cols">
          <div className="kd-stack">
            {/* Plan */}
            <section className="kd-sheet">
              <div className="kd-head">
                <h2>Plan</h2>
                <span className="count mono">
                  {done} of {plan.length}
                </span>
              </div>
              <div className="kd-list">
                {plan.map((p) => (
                  <div key={p.title} className="kd-row" data-state={p.state}>
                    <DotGlyph state={p.state} />
                    <span className="t">{p.title}</span>
                    <span className="m mono">{p.meta}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Trace */}
            <section className="kd-sheet">
              <div className="kd-head">
                <h2>Trace</h2>
                <span className="count mono">7 spans</span>
              </div>
              <div className="kd-trace">
                <Span label="plan" start={0} width={0.05} duration="9.8s" color="var(--ink-3)" />
                <Span
                  label="explorer"
                  start={0.06}
                  width={0.22}
                  duration="1m 36s"
                  color="var(--ink-3)"
                />
                <Span
                  label="edit_file"
                  start={0.29}
                  width={0.17}
                  duration="1m 14s"
                  color="var(--ink-3)"
                />
                <Span
                  label="pnpm test"
                  start={0.47}
                  width={0.05}
                  duration="18s"
                  color="var(--ink-3)"
                />
                <Span label="test-writer" start={0.5} width={0.3} duration="1:35" live />
                <Span
                  label="db:migrate"
                  start={0.8}
                  width={decision === "approved" ? 0.04 + (0.14 * streamed) / MIGRATE.length : 0.02}
                  duration={pending ? "" : migrated ? "5.1s" : ""}
                  color={
                    pending ? "var(--ember)" : decision === "denied" ? "var(--red)" : undefined
                  }
                  live={!migrated && decision !== "denied"}
                />
                <div className="kd-axis mono">
                  <span />
                  <div>
                    <span>0</span>
                    <span>2m</span>
                    <span>4m</span>
                    <span>6m</span>
                    <span>8m</span>
                  </div>
                  <span />
                </div>
              </div>
            </section>
          </div>

          <div className="kd-stack">
            {/* Approval */}
            <section className="kd-sheet kd-approval" data-decision={decision}>
              <div className="kd-halftone">
                <i
                  style={
                    {
                      "--r": "1.7px",
                      "--from": "0%",
                      "--mid": "0%",
                      "--to": "30%",
                    } as React.CSSProperties
                  }
                />
                <i
                  style={
                    {
                      "--r": "1.2px",
                      "--from": "22%",
                      "--mid": "32%",
                      "--to": "48%",
                    } as React.CSSProperties
                  }
                />
                <i
                  style={
                    {
                      "--r": "0.7px",
                      "--from": "40%",
                      "--mid": "50%",
                      "--to": "66%",
                    } as React.CSSProperties
                  }
                />
              </div>
              <div className="top">
                <DotGlyph state={migrateState} />
                {pending
                  ? "Needs you"
                  : decision === "denied"
                    ? "Denied"
                    : migrated
                      ? "Approved"
                      : "Approved, running"}
                {pending && <span className="wait mono">{clock(14_000 + elapsed)}</span>}
              </div>
              <h3>Run the sessions migration on production</h3>
              <div className="by">
                <Sigil name="migrator" small />
                <span>
                  <b style={{ fontWeight: 500, color: "var(--ink)" }}>migrator</b> asks, for step 4
                  of the plan
                </span>
              </div>
              <div className="kd-cmd mono">
                <span className="p">$</span>
                <span>
                  <b>pnpm</b> db:migrate <span className="f">--env</span> production
                </span>
              </div>
              <dl className="kd-facts">
                {[
                  ["Target", "acme-prod · Postgres 16"],
                  ["Rows affected", "48,210"],
                  ["Rollback", "Snapshot first, about 2 min"],
                ].map(([k, v]) => (
                  <div key={k} className="kd-fact">
                    <dt>{k}</dt>
                    <i />
                    <dd className={k === "Rows affected" ? "mono" : undefined}>{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="kd-foot">
                {pending ? (
                  <>
                    <span className="kd-risk">
                      <span>
                        <i />
                        <i />
                        <i />
                      </span>
                      High risk
                    </span>
                    <span className="sp" />
                    <button type="button" className="kd-btn" onClick={() => setDecision("denied")}>
                      Deny <span className="kd-key">Esc</span>
                    </button>
                    <button
                      type="button"
                      className="kd-btn primary"
                      onClick={() => setDecision("approved")}
                    >
                      Run migration <span className="kd-key">⌘↵</span>
                    </button>
                  </>
                ) : (
                  <>
                    <span className="kd-outcome">
                      {decision === "denied"
                        ? "Nothing ran. The agent moved on to the preview."
                        : migrated
                          ? "Ran with your approval. 48,210 rows backfilled."
                          : "Running with your approval…"}
                    </span>
                    <span className="sp" />
                    <button type="button" className="kd-btn" onClick={() => setDecision("pending")}>
                      Ask again <span className="kd-key">R</span>
                    </button>
                  </>
                )}
              </div>
            </section>

            {/* Terminal */}
            <section className="kd-sheet">
              <div className="kd-head">
                <h2>Terminal</h2>
                <span className="count mono">~/acme-web</span>
                <span className="end mono">
                  {decision === "approved" ? (migrated ? "exit 0" : "running") : "exit 0"}
                </span>
              </div>
              <div className="kd-term mono">
                {decision === "approved" ? (
                  <>
                    <div>
                      <span className="dim">$ </span>
                      <span className="cmd">pnpm db:migrate --env production</span>
                    </div>
                    {MIGRATE.slice(0, streamed).map(([cls, text, time]) => (
                      <div key={text} className={`line ${cls}`}>
                        {text}
                        {time && <span className="dim">{time}</span>}
                      </div>
                    ))}
                    {!migrated && <span className="kd-caret" />}
                  </>
                ) : (
                  <>
                    <div>
                      <span className="dim">$ </span>
                      <span className="cmd">pnpm test src/auth</span>
                    </div>
                    <div className="ok">
                      ✓ src/auth/client.test.ts<span className="dim"> 42ms</span>
                    </div>
                    <div className="ok">
                      ✓ src/middleware.test.ts<span className="dim"> 31ms</span>
                    </div>
                    <div className="ok">
                      ✓ src/routes/account.test.ts<span className="dim"> 64ms</span>
                    </div>
                    <div className="ok">
                      ✓ src/auth/login.test.ts<span className="dim"> 55ms</span>
                    </div>
                    <div> </div>
                    <div>
                      30 passed<span className="dim"> in 1.84s</span>
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>

          <div className="kd-stack">
            {/* Subagents */}
            <section className="kd-sheet">
              <div className="kd-head">
                <h2>Subagents</h2>
                <span className="count mono">{agents.length}</span>
              </div>
              <div className="kd-list">
                {agents.map((a) => (
                  <div key={a.name} className="kd-agent">
                    <Sigil name={a.name} />
                    <span className="n">{a.name}</span>
                    <span className="r mono">
                      {a.time}
                      <DotGlyph state={a.state} />
                    </span>
                    <span className="a">{a.activity}</span>
                    {a.progress != null && <Rail value={a.progress} live />}
                  </div>
                ))}
              </div>
            </section>

            {/* Context */}
            <section className="kd-sheet">
              <div className="kd-head">
                <h2>Context</h2>
                <span className="end mono">132k of 200k</span>
              </div>
              <div className="kd-ctx">
                <div
                  className="kd-matrix"
                  role="img"
                  aria-label="66% of the context window is used"
                >
                  {Array.from({ length: 100 }, (_, i) => (
                    <i key={i} data-s={matrix[i]} />
                  ))}
                </div>
                <div className="kd-legend">
                  {CONTEXT.map(([label, , tokens], s) => (
                    <div key={label}>
                      <i
                        style={{
                          background:
                            s === 0
                              ? "var(--ink)"
                              : `color-mix(in oklch, var(--ink) ${[100, 62, 38, 22][s]}%, transparent)`,
                        }}
                      />
                      {label}
                      <span className="mono">{tokens}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
