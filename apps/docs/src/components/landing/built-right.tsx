const ITEMS = [
  {
    title: "Accessible",
    body: "Keyboard maps, visible focus, sensible roles and live regions that announce without spamming.",
    note: "⌘↵  Esc  j  k  a  r",
  },
  {
    title: "Calm under reduced motion",
    body: "Every animation has a reduced-motion path. State still reads; travel and shimmer go away.",
    note: "prefers-reduced-motion",
  },
  {
    title: "Themeable tokens",
    body: "Light and dark from one set of CSS variables on Tailwind v4. No dark: variants to chase.",
    note: "--kura-surface  --kura-accent",
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
        <li key={item.title} className="flex flex-col border-kura-border border-t pt-5">
          <h3 className="font-semibold text-[16px] tracking-[-0.015em]">{item.title}</h3>
          <p className="pt-2 text-[14.5px] text-kura-fg-muted leading-relaxed">{item.body}</p>
          <p className="mt-auto truncate pt-5 font-kura-mono text-[12px] text-kura-fg-subtle">
            {item.note}
          </p>
        </li>
      ))}
    </ul>
  );
}
