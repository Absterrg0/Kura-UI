/**
 * Shared test helpers for every Kura component test.
 *
 *   import { axe, render, screen, setReducedMotion, userEvent } from "../../../test/utils";
 */
import { act, type RenderOptions, type RenderResult, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axeCore from "axe-core";
import type * as React from "react";
import { expect } from "vitest";

export * from "@testing-library/react";
export { userEvent };

// --- matchMedia + reduced motion ---------------------------------------------------------------

let reducedMotion = false;
const listeners = new Set<() => void>();

export function installMatchMedia(): void {
  window.matchMedia = (query: string) => {
    const matches = () =>
      query.includes("prefers-reduced-motion: reduce") ? reducedMotion : false;
    return {
      get matches() {
        return matches();
      },
      media: query,
      onchange: null,
      addEventListener: (_: string, cb: () => void) => listeners.add(cb),
      removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
      addListener: (cb: () => void) => listeners.add(cb),
      removeListener: (cb: () => void) => listeners.delete(cb),
      dispatchEvent: () => true,
    } as unknown as MediaQueryList;
  };
}

/** Toggle `prefers-reduced-motion: reduce` for the current test (reset to false before each test). */
export function setReducedMotion(value: boolean): void {
  reducedMotion = value;
  act(() => {
    for (const l of listeners) l();
  });
}

// --- platform ----------------------------------------------------------------------------------

/** Pretend to be on macOS (true) or Windows/Linux (false). */
export function setApplePlatform(apple: boolean): void {
  Object.defineProperty(window.navigator, "platform", {
    value: apple ? "MacIntel" : "Win32",
    configurable: true,
  });
}

// --- accessibility -----------------------------------------------------------------------------

/**
 * Run axe-core against a container and fail with a readable list of violations.
 * Color-contrast is skipped (jsdom has no layout/CSS); it is covered by the visual tests.
 */
export async function axe(container: Element): Promise<void> {
  const results = await axeCore.run(container, {
    rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
  });
  const messages = results.violations.map(
    (v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.html).join("\n  ")}`,
  );
  expect(messages, `axe violations:\n${messages.join("\n")}`).toEqual([]);
}

/** render() + axe() in one call. */
export async function renderA11y(
  ui: React.ReactElement,
  options?: RenderOptions,
): Promise<RenderResult> {
  const result = render(ui, options);
  await axe(result.container);
  return result;
}
