import { ApprovalPrompt } from "@kura/components/approval-prompt";
import { DiffView } from "@kura/components/diff-view";
import { AbsoluteFill } from "remotion";
import { filmNow } from "../../lib/clock";
import { DIFF } from "../data";
import { clamp, E, mix, pulse, spr, tw } from "../ease";
import { K, MONO } from "../palette";
import { useF } from "../shot";
import { AgentPointer, Anchored, anchorOf, HandPointer, targetOf, useRemeasure } from "../stage";
import { B } from "../timing";

/** A ring of dots sent out from a pointer's tip when it presses (as the docs' agent demo does). */
function Ripple({ x, y, since }: { x: number; y: number; since: number }) {
  if (since < 0 || since > 26) return null;
  const t = E.out(since / 26);
  return (
    <svg
      width={1920}
      height={1080}
      viewBox="0 0 1920 1080"
      style={{ position: "absolute", inset: 0 }}
      aria-hidden
    >
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <circle
            key={i}
            cx={x + Math.cos(a) * 70 * t}
            cy={y + Math.sin(a) * 70 * t}
            r={6 * (1 - t) + 1}
            fill={K.fg}
            opacity={1 - t}
          />
        );
      })}
    </svg>
  );
}

/** Pin point that centres an anchored component (anchored on its root) in the frame. */
function centre(id: string, scale: number, dx = 0, dy = 0) {
  const a = anchorOf(id);
  if (!a) return { x: 960, y: 540 };
  return { x: 960 + dx + (a.ox - a.W / 2) * scale, y: 540 + dy + (a.oy - a.H / 2) * scale };
}

/**
 * 0:34.1. The real ApprovalPrompt, readable. A person's pointer travels to "Run migration" and
 * clicks on the downbeat of bar 17, when the music comes back. The ember leaves with the decision.
 */
export function Approve() {
  const f = useF();
  const remeasure = useRemeasure();
  const press = B(68);
  // A small give on the click: the card takes the press, then settles into its decided state.
  const give = f >= B(68) ? 0.018 * Math.exp(-(f - B(68)) / 7) * Math.cos((f - B(68)) / 3) : 0;
  const s = mix(1.02, 1.1, tw(f, B(67), B(69), 0, 1, E.inOut)) - give;
  const P = centre("approve", s, 0, 0);
  const btn = targetOf("approve", 0, P.x, P.y, s);
  const decision = f >= press ? "approved" : "pending";
  const travel = E.inOut(clamp((f - B(67.15)) / (press - 3 - B(67.15))));
  const hx = mix(btn.x + 380, btn.x - 4, travel);
  const hy = mix(btn.y + 300, btn.y + 4, travel);
  return (
    <AbsoluteFill>
      <Anchored
        onMeasured={remeasure}
        id="approve"
        width={560}
        zoom={2.85}
        selector="[data-slot=approval-prompt]"
        targets={["[data-slot=approval-prompt-actions] button:last-of-type"]}
        px={P.x}
        py={P.y}
        scale={s}
      >
        <ApprovalPrompt
          title="Run the migration on production"
          agent={{ name: "migrator", detail: "step 6 of the plan" }}
          requestedAt={filmNow() - 14_000}
          command="pnpm db:migrate --env production"
          facts={[
            { label: "Target", value: "acme-prod · Postgres 16" },
            { label: "Rows affected", value: "48,210" },
            { label: "Rollback", value: "Snapshot first, about 2 min" },
          ]}
          risk="high"
          decision={decision}
          shortcuts={false}
          approveLabel="Run migration"
          denyLabel="Deny"
        />
      </Anchored>
      <HandPointer x={hx} y={hy} press={pulse(f - press, 10)} />
      <Ripple x={btn.x} y={btn.y} since={f - press} />
    </AbsoluteFill>
  );
}

/**
 * 0:38.6. What your agent sees: `agent.snapshot()` lists the screen by name, in a sunken well, at
 * headline size; the rows land on the sixteenths, then the agent's next call is typed.
 */
const SNAP: [string, string, string][] = [
  ["task-list", '"Plan"', "6/6 done"],
  ["diff-view", '"Changes"', "3 hunks"],
  ["approval-prompt", '"Deploy"', "pending"],
];
const ACT = 'agent.act({ steps: [{\n  ref: "Accept all", action: "press" }] })';
const SNAP_AT = 76;
export function Snapshot() {
  const f = useF();
  const rowsAt = SNAP_AT + 0.25;
  const rows = Math.min(
    SNAP.length,
    Math.max(0, Math.floor((f - B(rowsAt)) / (B(rowsAt + 0.25) - B(rowsAt))) + 1),
  );
  const typeAt = B(SNAP_AT + 1);
  const typed = Math.max(0, Math.min(ACT.length, Math.floor((f - typeAt) / 0.7)));
  const t = tw(f, B(SNAP_AT), B(SNAP_AT + 2.5), 0, 1, E.out);
  const size = 64;
  const line = size * 1.45;
  const caret = Math.floor(f / 30) % 2 === 0 || typed < ACT.length ? "\u258d" : " ";
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        className="rounded-kura-xl bg-kura-surface-sunken shadow-kura-sunk"
        style={{
          width: 1780,
          padding: "64px 84px",
          fontFamily: MONO,
          fontSize: size,
          lineHeight: `${line}px`,
          letterSpacing: "-0.03em",
          whiteSpace: "pre",
          transform: `translateY(${mix(24, 0, t)}px) scale(${mix(0.985, 1.015, t)})`,
        }}
      >
        <div style={{ color: "var(--kura-fg-subtle)", marginBottom: line * 0.25 }}>
          <span style={{ color: "var(--kura-fg)" }}>agent</span>.snapshot()
        </div>
        {SNAP.map(([c, label, value], i) => (
          <div
            key={c}
            style={{
              display: "grid",
              gridTemplateColumns: "620px 420px 1fr",
              opacity: i < rows ? 1 : 0,
              transform: `translateY(${i < rows ? (1 - spr(f, B(rowsAt + i * 0.25), "snap")) * 10 : 0}px)`,
            }}
          >
            <span style={{ color: "var(--kura-fg-subtle)" }}>{c}</span>
            <span style={{ color: "var(--kura-fg)" }}>{label}</span>
            <span style={{ color: "var(--kura-fg-muted)" }}>{value}</span>
          </div>
        ))}
        <div style={{ color: "var(--kura-fg)", marginTop: line * 0.5, minHeight: line * 2 }}>
          {f >= typeAt ? ACT.slice(0, typed) : ""}
          <span style={{ color: "var(--kura-fg-muted)" }}>{f >= typeAt ? caret : ""}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

/** 0:39.9. The agent presses "Accept all" by name; the hunks are accepted. */
export function AgentDiff() {
  const f = useF();
  const remeasure = useRemeasure();
  const press = B(80);
  const s = mix(1.22, 1.3, tw(f, B(78.5), B(81), 0, 1, E.inOut));
  const P = { x: 960, y: 290 };
  const btn = targetOf("agent-diff", 0, P.x, P.y, s);
  const travel = E.inOut(clamp((f - B(78.6)) / (press - 3 - B(78.6))));
  const ax = mix(btn.x - 420, btn.x - 4, travel);
  const ay = mix(btn.y + 300, btn.y + 6, travel);
  const review: Record<string, "accepted"> =
    f >= press
      ? {
          "src/auth/client.ts#0": "accepted",
          "src/auth/client.ts#1": "accepted",
          "src/auth/client.ts#2": "accepted",
        }
      : {};
  return (
    <AbsoluteFill>
      <Anchored
        onMeasured={remeasure}
        id="agent-diff"
        width={640}
        zoom={2.1}
        selector="[data-slot=diff-view-header]"
        targets={["[data-slot=diff-view-accept-all]"]}
        px={P.x}
        py={P.y}
        scale={s}
      >
        <DiffView diff={DIFF} review={review} collapseReviewed={false} autoAdvance={false} />
      </Anchored>
      <AgentPointer
        x={ax}
        y={ay}
        size={1.8}
        press={pulse(f - press, 10)}
        note='press "Accept all"'
        flip="below"
      />
      <Ripple x={btn.x} y={btn.y} since={f - press} />
    </AbsoluteFill>
  );
}

/**
 * 0:41.2. The agent reaches for "Deploy". It is marked for a person, so the agent stops and waits:
 * the prompt stays pending, ember, until someone decides.
 */
export function AgentAsks() {
  const f = useF();
  const remeasure = useRemeasure();
  const press = B(82);
  const s =
    mix(1.02, 1.1, tw(f, B(81), B(82), 0, 1, E.inOut)) + 0.22 * tw(f, B(82), B(84), 0, 1, E.inOut);
  const P = centre("agent-asks", s, 0, -90);
  const btn = targetOf("agent-asks", 0, P.x, P.y, s);
  const travel = E.inOut(clamp((f - B(81.1)) / (press - 3 - B(81.1))));
  const ax = mix(btn.x - 320, btn.x - 6, travel);
  const ay = mix(btn.y + 150, btn.y + 6, travel);
  const refused = f >= press;
  return (
    <AbsoluteFill>
      <Anchored
        onMeasured={remeasure}
        id="agent-asks"
        width={560}
        zoom={2.6}
        selector="[data-slot=approval-prompt]"
        targets={["[data-slot=approval-prompt-actions] button:last-of-type"]}
        px={P.x}
        py={P.y}
        scale={s}
      >
        <ApprovalPrompt
          title="Deploy to production"
          agent={{ name: "Kura", detail: "after the migration" }}
          requestedAt={filmNow() - 2_000}
          command="vercel deploy --prod"
          facts={[{ label: "Project", value: "acme-web" }]}
          risk="high"
          decision="pending"
          shortcuts={false}
          approveLabel="Deploy"
          denyLabel="Deny"
        />
      </Anchored>
      <AgentPointer
        x={refused ? ax - 18 * spr(f, press, "snap") : ax}
        y={ay}
        size={1.8}
        press={pulse(f - press, 10)}
        note={refused ? "waiting for you" : 'press "Deploy"'}
        flip="below"
      />
    </AbsoluteFill>
  );
}
