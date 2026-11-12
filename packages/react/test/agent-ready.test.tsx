/**
 * Every Kura example, seen by an agent: each component that `createAgent` lists must have a name,
 * or it's a control an agent (and a screen-reader user) can't find. See the ui-sdk agent guide.
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { createAgent } from "@ui-sdk/react/agent";
import type * as React from "react";
import { describe, expect, it } from "vitest";
import { act, render } from "./utils";

const root = join(__dirname, "../src/components");
const modules: Record<string, Record<string, React.ComponentType>> = {};
for (const slug of readdirSync(root).sort()) {
  modules[`${slug}/`] = await import(`../src/components/${slug}/${slug}.examples.tsx`);
}

const agent = createAgent();

describe("agent-ready", () => {
  for (const [path, mod] of Object.entries(modules)) {
    const slug = path.split("/").at(-2);
    for (const [name, Example] of Object.entries(mod)) {
      if (typeof Example !== "function") continue;
      it(`${slug} ${name}: every component an agent sees has a name`, async () => {
        const { unmount } = render(<Example />);
        await act(() => new Promise((r) => setTimeout(r, 0)));
        const unnamed = agent
          .snapshot()
          .filter((e) => !e.offPage && e.component !== "more" && !e.label)
          .map((e) => `${e.component} ${e.ref}`);
        expect(unnamed, `unnamed: ${unnamed.join(", ")}`).toEqual([]);
        unmount();
      });
    }
  }
});
