"use client";

import { useReducedMotion } from "@kura-ui/react/hooks";
import { Kbd } from "@kura-ui/react/kbd";
import * as React from "react";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "../theme-toggle";

/**
 * "Built right": four promises, each with a small live specimen above it. The specimens sit in
 * wells, so nothing is cropped and every key reads whole.
 */

// The diff review keys, pressed in turn, with what each does.
const KEYS = [
  { key: "J", does: "next change" },
  { key: "K", does: "previous change" },
  { key: "A", does: "accept change" },
  { key: "R", does: "reject change" },
] as const;

function KeysSpecimen() {
  const reduced = useReducedMotion();
  const [i, setI] = React.useState(2);
  const [down, setDown] = React.useState(false);
  React.useEffect(() => {
    if (reduced) return;
    let n = 2;
    const id = setInterval(() => {
      n = (n + 1) % KEYS.length;
      setI(n);
      setDown(true);
      setTimeout(() => setDown(false), 180);
    }, 1400);
    return () => clearInterval(id);
  }, [reduced]);
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-1.5">
        {KEYS.map((k, n) => (
          <Kbd
            key={k.key}
            pressed={n === i && down}
            className={cn(
              "h-8 min-w-8 text-[13px] transition-colors",
              n === i ? "text-kura-fg" : "text-kura-fg-subtle",
            )}
          >
            {k.key}
          </Kbd>
        ))}
      </div>
      <p className="h-4 font-kura-mono text-[11.5px] text-kura-fg-muted" aria-hidden>
        {KEYS[i]!.key} <span className="text-kura-fg-subtle">·</span> {KEYS[i]!.does}
      </p>
    </div>
  );
}

// Twelve dots on a ring: one copy runs a light round it, the other holds it still.
function Ring({ still }: { still?: boolean }) {
  const n = 12;
  return (
    <svg viewBox="0 0 40 40" aria-hidden className="size-10">
      {Array.from({ length: n }, (_, k) => {
        const a = (k / n) * Math.PI * 2 - Math.PI / 2;
        return (
          <circle
            key={k}
            cx={20 + Math.cos(a) * 15}
            cy={20 + Math.sin(a) * 15}
            r={2}
            fill="currentColor"
            className={still ? undefined : "ring-chase"}
            style={
              still
                ? { opacity: k === 0 ? 1 : k === 11 ? 0.6 : 0.2 }
                : ({ "--k": k } as React.CSSProperties)
            }
          />
        );
      })}
    </svg>
  );
}

function MotionSpecimen() {
  return (
    <div className="flex items-end gap-8 text-kura-fg">
      <div className="flex flex-col items-center gap-2.5">
        <Ring />
        <span className="font-kura-mono text-[11.5px] text-kura-fg-subtle">motion</span>
      </div>
      <span aria-hidden className="kura-leader mb-[30px] h-[5px] w-10" />
      <div className="flex flex-col items-center gap-2.5">
        <Ring still />
        <span className="font-kura-mono text-[11.5px] text-kura-fg-subtle">reduced</span>
      </div>
    </div>
  );
}

const TOKENS = [
  ["--kura-canvas", "bg-kura-canvas"],
  ["--kura-surface", "bg-kura-surface"],
  ["--kura-fg", "bg-kura-fg"],
  ["--kura-ember", "bg-kura-ember"],
] as const;

function TokensSpecimen() {
  return (
    <div className="flex w-full items-center justify-between gap-3 px-4">
      <ul className="flex flex-col gap-1.5">
        {TOKENS.map(([name, bg]) => (
          <li key={name} className="flex items-center gap-2 font-kura-mono text-[11.5px]">
            <span
              aria-hidden
              className={cn(
                "size-3 rounded-full shadow-[inset_0_0_0_1px_var(--kura-border-strong)]",
                bg,
              )}
            />
            <span className="text-kura-fg-muted">{name}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col items-center gap-1.5">
        <ThemeToggle size="md" className="sheet rounded-full" />
        <span className="font-kura-mono text-[11px] text-kura-fg-subtle">try it</span>
      </div>
    </div>
  );
}

function SourceSpecimen() {
  const row = "flex h-5 items-center gap-1.5 whitespace-nowrap";
  return (
    <div className="w-full px-5 font-kura-mono text-[12px] text-kura-fg-muted">
      <div className={row}>components/</div>
      <div className={cn(row, "pl-3")}>
        <span aria-hidden className="kura-leader h-[5px] w-2.5" />
        kura/
      </div>
      <div className={cn(row, "pl-7")}>
        <span aria-hidden className="kura-leader h-[5px] w-2.5" />
        <span className="text-kura-fg">diff-view.tsx</span>
        <span className="ml-auto rounded-[5px] bg-kura-hover px-1.5 text-[10.5px] text-kura-fg-subtle">
          yours
        </span>
      </div>
      <div className={cn(row, "pl-7")}>
        <span aria-hidden className="kura-leader h-[5px] w-2.5" />
        terminal.tsx
      </div>
    </div>
  );
}

const ITEMS = [
  {
    title: "Accessible",
    body: "Keyboard maps, visible focus, sensible roles and live regions that announce without spamming.",
    specimen: <KeysSpecimen />,
  },
  {
    title: "Calm under reduced motion",
    body: "Every animation has a reduced-motion path. State still reads; glyphs and rails hold still.",
    specimen: <MotionSpecimen />,
  },
  {
    title: "Themeable tokens",
    body: "Light and dark from one set of CSS variables on Tailwind v4. No dark: variants to chase.",
    specimen: <TokensSpecimen />,
  },
  {
    title: "Source you own",
    body: "Copy a component into your repo with the shadcn CLI and change anything. Or take it from npm.",
    specimen: <SourceSpecimen />,
  },
];

export function BuiltRight() {
  return (
    <ul className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
      {ITEMS.map((item, i) => (
        <li
          key={item.title}
          data-reveal-item
          style={{ "--d": i } as React.CSSProperties}
          className="flex flex-col"
        >
          <div className="well flex h-36 items-center justify-center rounded-kura-xl">
            {item.specimen}
          </div>
          <h3 className="pt-5 font-semibold text-[16px] tracking-[-0.015em]">{item.title}</h3>
          <p className="pt-2 text-[14.5px] text-kura-fg-muted leading-relaxed">{item.body}</p>
        </li>
      ))}
    </ul>
  );
}
