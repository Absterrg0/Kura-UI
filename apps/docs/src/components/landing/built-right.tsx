import { Code2, Keyboard, Palette, Snail } from "lucide-react";

const ITEMS = [
  {
    icon: Keyboard,
    title: "Accessible",
    body: "Keyboard maps, visible focus, sensible roles and live regions that announce without spamming.",
    note: "⌘↵  Esc  j  k  a  r",
  },
  {
    icon: Snail,
    title: "Calm under reduced motion",
    body: "Every animation has a reduced-motion path. State still reads; travel and shimmer go away.",
    note: "prefers-reduced-motion",
  },
  {
    icon: Palette,
    title: "Themeable tokens",
    body: "Light and dark from one set of CSS variables on Tailwind v4. No dark: variants to chase.",
    note: "--kura-surface  --kura-accent",
  },
  {
    icon: Code2,
    title: "Source you own",
    body: "Copy a component into your repo with the shadcn CLI and change anything. Or take it from npm.",
    note: "components/kura/diff-view.tsx",
  },
];

export function BuiltRight() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
      {ITEMS.map((item) => (
        <li key={item.title} className="gloss flex flex-col rounded-[18px] bg-kura-surface p-6">
          <span className="inline-flex size-9 items-center justify-center rounded-[10px] bg-kura-surface-raised text-kura-fg shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_var(--kura-border)]">
            <item.icon className="size-[17px]" strokeWidth={1.75} />
          </span>
          <h3 className="pt-5 font-semibold text-[16px] tracking-[-0.015em]">{item.title}</h3>
          <p className="pt-1.5 text-[14.5px] text-kura-fg-muted leading-relaxed">{item.body}</p>
          <p className="mt-auto truncate pt-6 font-kura-mono text-[12px] text-kura-fg-subtle">
            {item.note}
          </p>
        </li>
      ))}
    </ul>
  );
}
