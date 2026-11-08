/**
 * Keyboard helpers shared by Kbd, KbdShortcut, Tooltip and any component that shows or binds keys.
 * Key names follow `KeyboardEvent.key` (case-insensitive) plus the aliases `mod`, `cmd`, `ctrl`,
 * `alt`/`option`, `shift`, `enter`/`return`, `esc`, arrows (`up`, `down`, `left`, `right`).
 * `mod` means ⌘ on Apple platforms and Ctrl elsewhere.
 */

export type KeyName = string;

const MODIFIERS = ["mod", "meta", "cmd", "command", "ctrl", "control", "alt", "option", "shift"];

/** True on macOS / iOS. SSR-safe: returns false on the server. */
export function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = nav.userAgentData?.platform ?? nav.platform ?? "";
  return /mac|iphone|ipad|ipod/i.test(platform);
}

/** Normalize an alias to a canonical key id. */
export function normalizeKey(key: KeyName): string {
  // `KeyboardEvent.key` for the space bar is " ": trimming it first would turn it into "".
  if (key.length > 0 && key.trim() === "") return " ";
  const k = key.trim().toLowerCase();
  switch (k) {
    case "cmd":
    case "command":
    case "meta":
      return "meta";
    case "control":
      return "ctrl";
    case "option":
      return "alt";
    case "return":
      return "enter";
    case "esc":
      return "escape";
    case "up":
      return "arrowup";
    case "down":
      return "arrowdown";
    case "left":
      return "arrowleft";
    case "right":
      return "arrowright";
    case "space":
    case "spacebar":
      return " ";
    default:
      return k;
  }
}

const APPLE_SYMBOLS: Record<string, string> = {
  mod: "⌘",
  meta: "⌘",
  ctrl: "⌃",
  alt: "⌥",
  shift: "⇧",
};

const SYMBOLS: Record<string, string> = {
  enter: "↵",
  escape: "Esc",
  backspace: "⌫",
  delete: "⌦",
  tab: "⇥",
  arrowup: "↑",
  arrowdown: "↓",
  arrowleft: "←",
  arrowright: "→",
  " ": "Space",
  capslock: "⇪",
  pageup: "PgUp",
  pagedown: "PgDn",
};

const LABELS: Record<string, string> = {
  mod: "Command",
  meta: "Command",
  ctrl: "Control",
  alt: "Option",
  shift: "Shift",
  enter: "Enter",
  escape: "Escape",
  backspace: "Backspace",
  delete: "Delete",
  tab: "Tab",
  arrowup: "Up arrow",
  arrowdown: "Down arrow",
  arrowleft: "Left arrow",
  arrowright: "Right arrow",
  " ": "Space",
};

/** Visible glyph for a key, platform-aware (⌘ vs Ctrl). */
export function formatKey(key: KeyName, apple = isApplePlatform()): string {
  const k = normalizeKey(key);
  if (apple && APPLE_SYMBOLS[k]) return APPLE_SYMBOLS[k];
  if (!apple) {
    if (k === "mod" || k === "ctrl") return "Ctrl";
    if (k === "meta") return "Win";
    if (k === "alt") return "Alt";
    if (k === "shift") return "Shift";
  }
  if (SYMBOLS[k]) return SYMBOLS[k];
  return k.length === 1 ? k.toUpperCase() : k.charAt(0).toUpperCase() + k.slice(1);
}

/** Spoken label for a key, used for aria-label ("Command K"). */
export function keyLabel(key: KeyName, apple = isApplePlatform()): string {
  const k = normalizeKey(key);
  if (k === "mod") return apple ? "Command" : "Control";
  if (!apple && k === "alt") return "Alt";
  if (LABELS[k]) return LABELS[k];
  return k.length === 1 ? k.toUpperCase() : k.charAt(0).toUpperCase() + k.slice(1);
}

export function isModifier(key: KeyName): boolean {
  return MODIFIERS.includes(key.trim().toLowerCase());
}

/**
 * Does a keyboard event match a combo like ["mod", "k"]? Modifiers must match exactly,
 * so ["mod", "k"] does not fire on ⌘⇧K.
 */
export function matchesKeyCombo(
  event: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "altKey" | "shiftKey">,
  keys: readonly KeyName[],
  apple = isApplePlatform(),
): boolean {
  const want = { meta: false, ctrl: false, alt: false, shift: false };
  let main: string | undefined;
  for (const raw of keys) {
    const k = normalizeKey(raw);
    if (k === "mod") {
      if (apple) want.meta = true;
      else want.ctrl = true;
    } else if (k === "meta" || k === "ctrl" || k === "alt" || k === "shift") {
      want[k] = true;
    } else {
      main = k;
    }
  }
  if (event.metaKey !== want.meta || event.ctrlKey !== want.ctrl || event.altKey !== want.alt) {
    return false;
  }
  if (!main) return false;
  const pressed = normalizeKey(event.key);
  // Shift is exact for letters, digits and named keys. For symbols ("?", "@") the shift state
  // is implied by the character itself, so only a required shift is enforced.
  const isSymbol = main.length === 1 && !/[a-z0-9]/.test(main);
  if (!isSymbol && event.shiftKey !== want.shift) return false;
  if (isSymbol && want.shift && !event.shiftKey) return false;
  return pressed === main;
}
