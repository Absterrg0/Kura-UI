/**
 * Focus rings must draw. In Tailwind v4, `outline-none` and `outline-hidden` both set
 * `--tw-outline-style: none`, so a later `focus-visible:outline-2` renders nothing unless the same
 * variant also sets `outline-solid`. This guards every shipped component file against that.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "../src/components");
const files = readdirSync(root).flatMap((slug) =>
  readdirSync(join(root, slug))
    .filter((f) => f.endsWith(".tsx") && !f.endsWith(".test.tsx"))
    .map((f) => join(root, slug, f)),
);

describe("focus rings", () => {
  it("never uses outline-none (use outline-hidden, with outline-solid on focus)", () => {
    const offenders = files.filter((f) => /\boutline-none\b/.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });

  it("pairs every <variant>:outline-2 with <variant>:outline-solid", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(/([^\s"'`]+:)outline-2\b/g)) {
        const variant = match[1] as string;
        if (!variant.includes("focus")) continue;
        // The pair must be in the same class string (the same line of the source).
        const lineStart = source.lastIndexOf("\n", match.index) + 1;
        const lineEnd = source.indexOf("\n", match.index);
        const line = source.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
        if (!line.includes(`${variant}outline-solid`))
          offenders.push(`${file}: ${variant}outline-2`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
