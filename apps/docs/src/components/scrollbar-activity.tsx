"use client";

import * as React from "react";

const ATTR = "data-scrollbar";
const LINGER = 900;

const scrolls = (el: Element) => {
  if (el.scrollHeight <= el.clientHeight && el.scrollWidth <= el.clientWidth) return false;
  const { overflowX, overflowY } = getComputedStyle(el);
  return /auto|scroll/.test(overflowX + overflowY);
};

/**
 * Shows a scrollbar only when it is wanted: while the pointer is over something that scrolls,
 * and for a moment after anything scrolls (the page included). Pairs with the
 * `[data-scrollbar]` styles in globals.css. Renders nothing.
 */
export function ScrollbarActivity() {
  React.useEffect(() => {
    let hovered = new Set<Element>();
    const timers = new WeakMap<Element, ReturnType<typeof setTimeout>>();
    const onOver = (e: PointerEvent) => {
      const next = new Set<Element>();
      for (
        let el = e.target as Element | null;
        el && el !== document.documentElement;
        el = el.parentElement
      ) {
        if (scrolls(el)) next.add(el);
      }
      for (const el of hovered) if (!next.has(el) && !timers.has(el)) el.removeAttribute(ATTR);
      for (const el of next) el.setAttribute(ATTR, "");
      hovered = next;
    };
    const onLeave = () => {
      for (const el of hovered) if (!timers.has(el)) el.removeAttribute(ATTR);
      hovered = new Set();
    };
    const onScroll = (e: Event) => {
      const el = e.target instanceof Element ? e.target : document.documentElement;
      el.setAttribute(ATTR, "");
      clearTimeout(timers.get(el));
      timers.set(
        el,
        setTimeout(() => {
          timers.delete(el);
          if (!hovered.has(el)) el.removeAttribute(ATTR);
        }, LINGER),
      );
    };
    document.addEventListener("pointerover", onOver);
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("scroll", onScroll, { capture: true });
    };
  }, []);
  return null;
}
