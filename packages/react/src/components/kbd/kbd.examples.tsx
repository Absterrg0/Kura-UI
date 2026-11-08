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
