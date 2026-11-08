import { X } from "lucide-react";
import { IconButton } from "../icon-button";
import { Kbd } from "./kbd";

export function KbdMinimal() {
  return <Kbd>Esc</Kbd>;
}

export function KbdFull() {
  return (
    <div className="flex flex-col items-center gap-4 text-kura-fg-muted text-sm">
      <p className="flex items-center gap-2">
        Search with <Kbd keys={["mod", "k"]} /> or <Kbd>/</Kbd>
      </p>
      <div className="flex items-center gap-3">
        <Kbd keys={["mod", "shift", "p"]} size="sm" />
        <Kbd keys={["alt", "enter"]} variant="ghost" />
        <Kbd keys={["up"]} pressed />
      </div>
    </div>
  );
}

const shortcutGroups: Array<{
  title: string;
  items: Array<{ label: string; keys: string[]; alt?: string[] }>;
}> = [
  {
    title: "General",
    items: [
      { label: "Command palette", keys: ["mod", "k"] },
      { label: "New chat", keys: ["mod", "shift", "o"] },
      { label: "Toggle sidebar", keys: ["mod", "b"] },
      { label: "Search chats", keys: ["/"] },
    ],
  },
  {
    title: "Composer",
    items: [
      { label: "Send message", keys: ["enter"] },
      { label: "New line", keys: ["shift", "enter"] },
      { label: "Stop generating", keys: ["esc"] },
      { label: "Edit last message", keys: ["up"] },
    ],
  },
  {
    title: "Conversation",
    items: [
      { label: "Copy last reply", keys: ["mod", "shift", "c"] },
      { label: "Regenerate", keys: ["mod", "r"] },
      { label: "Previous / next reply", keys: ["alt", "up"], alt: ["alt", "down"] },
      { label: "Jump to latest", keys: ["mod", "down"] },
    ],
  },
  {
    title: "Voice & files",
    items: [
      { label: "Dictate", keys: ["mod", "shift", "d"] },
      { label: "Push to talk", keys: ["alt", "space"] },
      { label: "Attach a file", keys: ["mod", "u"] },
      { label: "Switch model", keys: ["mod", "shift", "m"] },
    ],
  },
];

export function KbdShortcutSheet() {
  return (
    <section
      aria-labelledby="shortcut-sheet-title"
      className="w-full max-w-2xl rounded-kura-xl bg-kura-surface shadow-kura-md"
    >
      <header className="flex items-center justify-between gap-4 border-kura-border-subtle border-b px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <h3 id="shortcut-sheet-title" className="font-medium text-[15px] text-kura-fg">
            Keyboard shortcuts
          </h3>
          <p className="text-kura-fg-muted text-[13px]">
            Press <Kbd keys={["mod", "/"]} size="sm" /> any time to open this sheet.
          </p>
        </div>
        <IconButton label="Close" icon={<X />} size="sm" shortcut={["esc"]} tooltipSide="left" />
      </header>
      <div className="grid gap-x-8 gap-y-5 px-5 py-4 sm:grid-cols-2">
        {shortcutGroups.map((group) => (
          <div key={group.title} className="flex flex-col gap-1">
            <h4 className="pb-1 font-medium text-kura-fg-subtle text-xs">{group.title}</h4>
            <dl className="flex flex-col">
              {group.items.map((item) => (
                <div
                  key={item.label}
                  className="flex h-8 items-center justify-between gap-4 text-[13px]"
                >
                  <dt className="truncate text-kura-fg-muted">{item.label}</dt>
                  <dd className="flex shrink-0 items-center gap-1.5">
                    <Kbd keys={item.keys} size="sm" />
                    {item.alt && (
                      <>
                        <span className="text-kura-fg-subtle text-xs">/</span>
                        <Kbd keys={item.alt} size="sm" />
                      </>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}
