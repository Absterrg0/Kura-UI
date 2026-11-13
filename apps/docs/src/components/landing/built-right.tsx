import { Kbd } from "@kura-ui/react/kbd";

const ITEMS = [
  {
    title: "Accessible",
    body: "Keyboard maps, visible focus, sensible roles and live regions that announce without spamming.",
    // Real keycaps, so the modifier reads ⌘ on a Mac and Ctrl elsewhere.
    note: (
      <span className="flex flex-wrap items-center gap-1.5">
        <Kbd keys={["mod", "enter"]} size="sm" />
        <Kbd keys={["esc"]} size="sm" />
        {["J", "K", "A", "R"].map((k) => (
          <Kbd key={k} size="sm">
            {k}
          </Kbd>
        ))}
      </span>
    ),
  },
  {
    title: "Calm under reduced motion",
    body: "Every animation has a reduced-motion path. State still reads; glyphs and rails hold still.",
    note: "prefers-reduced-motion",
  },
  {
    title: "Themeable tokens",
    body: "Light and dark from one set of CSS variables on Tailwind v4. No dark: variants to chase.",
    note: "--kura-surface  --kura-ember",
  },
  {
    title: "Source you own",
    body: "Copy a component into your repo with the shadcn CLI and change anything. Or take it from npm.",
    note: "components/kura/diff-view.tsx",
  },
];

export function BuiltRight() {
  return (
    <ul className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
      {ITEMS.map((item) => (
        <li key={item.title} className="flex flex-col">
          <span aria-hidden className="kura-leader mb-5 h-[5px]" />
          <h3 className="font-semibold text-[16px] tracking-[-0.015em]">{item.title}</h3>
          <p className="pt-2 text-[14.5px] text-kura-fg-muted leading-relaxed">{item.body}</p>
          <div className="mt-auto truncate pt-5 font-kura-mono text-[12px] text-kura-fg-subtle">
            {item.note}
          </div>
        </li>
      ))}
    </ul>
  );
}
