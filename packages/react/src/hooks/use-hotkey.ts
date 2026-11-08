import { useEffect, useRef } from "react";
import { isApplePlatform, type KeyName, matchesKeyCombo } from "../lib/keys";

export interface UseHotkeyOptions {
  /** Default true. */
  enabled?: boolean;
  /** Call preventDefault on match. Default true. */
  preventDefault?: boolean;
  /**
   * Fire while focus is in an input, textarea or contenteditable. Defaults to true only when the
   * combo contains a modifier (so "/" does not hijack typing but "mod+k" still works).
   */
  allowInInputs?: boolean;
  /** Element to listen on. Default `document`. */
  target?: EventTarget | null;
  /** Also report key-up so UIs can show a pressed state. */
  onKeyUp?: (event: KeyboardEvent) => void;
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

/**
 * Bind a keyboard shortcut. `keys` uses `mod` for ⌘/Ctrl: `useHotkey(["mod", "enter"], send)`.
 * SSR-safe; the listener is attached after mount and the latest handler is always used.
 */
export function useHotkey(
  keys: readonly KeyName[] | null,
  handler: (event: KeyboardEvent) => void,
  options: UseHotkeyOptions = {},
): void {
  const { enabled = true, preventDefault = true, allowInInputs, target, onKeyUp } = options;
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const keyUpRef = useRef(onKeyUp);
  keyUpRef.current = onKeyUp;
  const combo = keys?.join("+") ?? "";

  useEffect(() => {
    if (!enabled || !combo) return;
    const el: EventTarget | null = target ?? (typeof document === "undefined" ? null : document);
    if (!el) return;
    const parts = combo.split("+");
    const apple = isApplePlatform();
    const hasModifier = parts.some((k) =>
      /^(mod|meta|cmd|command|ctrl|control|alt|option)$/i.test(k),
    );
    const inInputs = allowInInputs ?? hasModifier;
    let down = false;

    const onDown = (event: Event) => {
      const e = event as KeyboardEvent;
      if (!inInputs && isEditable(e.target)) return;
      if (!matchesKeyCombo(e, parts, apple)) return;
      if (preventDefault) e.preventDefault();
      down = true;
      handlerRef.current(e);
    };
    const onUp = (event: Event) => {
      if (!down) return;
      down = false;
      keyUpRef.current?.(event as KeyboardEvent);
    };
    el.addEventListener("keydown", onDown);
    el.addEventListener("keyup", onUp);
    return () => {
      el.removeEventListener("keydown", onDown);
      el.removeEventListener("keyup", onUp);
    };
  }, [combo, enabled, preventDefault, allowInInputs, target]);
}
