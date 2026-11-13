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
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px]">
        <span className="flex items-center gap-2">
          Run task <Kbd keys={["mod", "shift", "p"]} size="sm" />
        </span>
        <span className="flex items-center gap-2">
          Insert line <Kbd keys={["alt", "enter"]} variant="ghost" />
        </span>
        <span className="flex items-center gap-2">
          Edit last <Kbd keys={["up"]} pressed />
        </span>
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
      className="w-full max-w-2xl rounded-kura-xl bg-kura-surface shadow-kura-surface"
    >
      <header className="flex h-11 items-center justify-between gap-4 pr-2 pl-5">
        <h3 id="shortcut-sheet-title" className="font-semibold text-[13px] text-kura-fg">
          Keyboard shortcuts
        </h3>
        <IconButton label="Close" icon={<X />} size="sm" shortcut={["esc"]} tooltipSide="left" />
      </header>
      <div className="grid gap-x-10 gap-y-4 px-5 pt-1 pb-4 sm:grid-cols-2">
        {shortcutGroups.map((group) => (
          <div key={group.title} className="flex flex-col">
            <h4 className="pb-1 font-medium text-kura-fg-subtle text-xs">{group.title}</h4>
            <dl className="flex flex-col">
              {group.items.map((item) => (
                <div
                  key={item.label}
                  className="flex h-8 items-center justify-between gap-4 text-[13px]"
                >
                  <dt className="truncate text-kura-fg">{item.label}</dt>
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
      <footer className="flex h-10 items-center px-5 text-[12.5px] text-kura-fg-subtle shadow-[inset_0_1px_0_var(--kura-border-subtle)]">
        <p>
          Press <Kbd keys={["mod", "/"]} size="sm" /> any time to open this sheet.
        </p>
      </footer>
    </section>
  );
}
