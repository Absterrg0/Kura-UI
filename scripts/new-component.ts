/**
 * pnpm new <slug> [--category <id>] [--client]
 *
 * Scaffolds packages/react/src/components/<slug>/ with the five required files. Tests pass
 * immediately; `pnpm validate:meta` fails until every TODO in the meta is replaced.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { CATEGORIES, COMPONENTS_DIR, RESERVED_SLUGS } from "./lib/config";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    category: { type: "string", default: "agent" },
    client: { type: "boolean", default: true },
  },
});
const slug = positionals[0];
if (!slug || !/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(slug) || RESERVED_SLUGS.includes(slug)) {
  console.error(
    "Usage: pnpm new <kebab-case-slug> [--category input|voice|conversation|agent|feedback|effects|primitives]",
  );
  process.exit(1);
}
if (!CATEGORIES.some((c) => c.id === values.category)) {
  console.error(
    `Unknown category "${values.category}". One of: ${CATEGORIES.map((c) => c.id).join(", ")}`,
  );
  process.exit(1);
}
const dir = join(COMPONENTS_DIR, slug);
if (existsSync(dir)) {
  console.error(`${slug} already exists`);
  process.exit(1);
}
const Name = slug.replace(/(^|-)([a-z0-9])/g, (_m, _d, c: string) => c.toUpperCase());
const files: Record<string, string> = {
  [`${slug}.tsx`]: `"use client";

import * as React from "react";
import { cn } from "../../lib/cn";

export interface ${Name}Props extends React.ComponentProps<"div"> {
  /** TODO: describe. */
  variant?: "default" | "subtle";
}

/**
 * TODO: one-paragraph description (shown in editor hovers).
 */
export function ${Name}({ variant = "default", className, children, ...props }: ${Name}Props) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      data-slot="${slug}"
      data-variant={variant}
      data-hovered={hovered}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className={cn(
        "rounded-kura-lg bg-kura-surface p-4 text-kura-fg text-sm shadow-kura-sm",
        "transition-shadow duration-(--kura-duration-fast) ease-kura-out motion-reduce:transition-none",
        variant === "subtle" && "bg-kura-surface-sunken shadow-kura-xs",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
`,
  [`${slug}.meta.ts`]: `import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "${slug}",
  name: "${Name}",
  category: "${values.category}",
  status: "experimental",
  description: "TODO: one line, ≤160 chars, starting with a noun phrase that says what it is.",
  whenToUse: ["TODO: a concrete situation an agent can match a user request against."],
  whenNotToUse: ["TODO: when to use something else — name the alternative slug."],
  props: [
    {
      name: "variant",
      type: '"default" | "subtle"',
      default: '"default"',
      description: "TODO: describe.",
    },
  ],
  parts: [{ name: "${Name}", dataSlot: "${slug}", description: "Root element." }],
  a11y: {
    notes: ["TODO: roles, labels, live regions, focus behaviour."],
    keyboard: [],
    reducedMotion: "TODO: what changes under prefers-reduced-motion.",
  },
  dependencies: { npm: [], kura: [] },
  related: [],
  tags: ["todo", "${values.category}", "${slug.split("-")[0]}"],
  examples: [
    { name: "${Name}Minimal", kind: "minimal", title: "Basic" },
    { name: "${Name}Full", kind: "full", title: "All props" },
    { name: "${Name}Composition", kind: "composition", title: "With other components" },
  ],
  agentNotes: [],
});
`,
  [`${slug}.examples.tsx`]: `"use client";

import { Button } from "../button";
import { ${Name} } from "./${slug}";

export function ${Name}Minimal() {
  return <${Name}>Hello from ${Name}</${Name}>;
}

export function ${Name}Full() {
  return (
    <div className="flex flex-col gap-3">
      <${Name} variant="default">Default</${Name}>
      <${Name} variant="subtle">Subtle</${Name}>
    </div>
  );
}

export function ${Name}Composition() {
  return (
    <${Name} className="flex items-center justify-between gap-4">
      Composed with Button
      <Button size="sm">Action</Button>
    </${Name}>
  );
}
`,
  [`${slug}.test.tsx`]: `import { describe, expect, it } from "vitest";
import { axe, render, screen, setReducedMotion } from "../../../test/utils";
import { ${Name} } from "./${slug}";
import { ${Name}Composition, ${Name}Full, ${Name}Minimal } from "./${slug}.examples";

describe("${Name}", () => {
  it("renders with data-slot and passes className through", () => {
    render(<${Name} className="custom">Content</${Name}>);
    const el = screen.getByText("Content");
    expect(el).toHaveAttribute("data-slot", "${slug}");
    expect(el).toHaveClass("custom");
  });

  it("respects reduced motion", () => {
    setReducedMotion(true);
    render(<${Name}>Content</${Name}>);
    expect(screen.getByText("Content").className).toContain("motion-reduce:transition-none");
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [${Name}Minimal, ${Name}Full, ${Name}Composition]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
`,
  "index.ts": `export { ${Name}, type ${Name}Props } from "./${slug}";
`,
};
mkdirSync(dir, { recursive: true });
for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content);
console.log(`✓ created packages/react/src/components/${slug}/ (${Object.keys(files).join(", ")})`);
console.log(
  "  Next: implement it, fill the meta (no TODOs), then `pnpm generate && pnpm validate:meta && pnpm --filter @kura-ui/react test` (validate fails until TODOs are gone).",
);
