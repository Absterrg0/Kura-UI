"use client";

import * as React from "react";

/** Where the removed control sat: the elements on either side of what was taken out. */
export interface FocusFallbackGap {
  next: Element | null;
  previous: Element | null;
}

const element = (node: Node | null, step: "nextSibling" | "previousSibling"): Element | null => {
  let n = node;
  while (n && !(n instanceof Element)) n = n[step];
  return n;
};

/**
 * Keeps keyboard focus inside a widget when the control that held it leaves the page: a Remove
 * key whose row is gone, a Stop key that unmounts when the run ends. Without this the browser
 * drops focus to `<body>` and the next Tab starts again from the top of the page.
 *
 * Pass the widget's root (give it `tabIndex={-1}` and a focus ring). Focus moves there, or to the
 * element `fallback` returns (the next row, a sibling control), and only when focus was really
 * lost: a person who has already moved on is left alone.
 */
export function useFocusFallback<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  fallback?: (gap: FocusFallbackGap) => HTMLElement | null | undefined,
): void {
  const fallbackRef = React.useRef(fallback);
  fallbackRef.current = fallback;

  React.useEffect(() => {
    const root = ref.current;
    if (!root || typeof MutationObserver === "undefined") return;
    let held: Element | null = null;

    const onFocusIn = (event: FocusEvent) => {
      held = event.target as Element;
    };
    // An ordinary blur (Tab, a click elsewhere) forgets the element. A blur that comes from the
    // element being removed must not: Chrome fires it while the node is still attached, Firefox
    // not at all. So wait until the DOM has settled, and forget only what is still on the page.
    const onFocusOut = (event: FocusEvent) => {
      const el = event.target as Element;
      if (held !== el) return;
      queueMicrotask(() => {
        if (held === el && el.isConnected) held = null;
      });
    };
    const observer = new MutationObserver((records) => {
      if (!held || held.isConnected) return;
      const gone = held;
      held = null;
      const active = document.activeElement;
      if (active && active !== document.body) return;
      const gap: FocusFallbackGap = { next: null, previous: null };
      for (const record of records) {
        for (const node of record.removedNodes) {
          if (node !== gone && !node.contains(gone)) continue;
          gap.next = element(record.nextSibling, "nextSibling");
          gap.previous = element(record.previousSibling, "previousSibling");
        }
      }
      const target = fallbackRef.current?.(gap);
      (target?.isConnected ? target : root).focus({ preventScroll: true });
    });

    root.addEventListener("focusin", onFocusIn);
    root.addEventListener("focusout", onFocusOut);
    observer.observe(root, { childList: true, subtree: true });
    return () => {
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("focusout", onFocusOut);
      observer.disconnect();
    };
  }, [ref]);
}
