// Council guard: no page may scroll sideways, at any width.
// Usage: node design/v3/overflow.mjs [width...]   (default: 1440 1024 768 390 390t; "t" = a touch phone)
//
// Round 6 found ten component pages wider than the screen after a one-line change to inline code.
// A check that compares scrollWidth with innerWidth misses it on a phone (innerWidth grows with
// the content there), so this one measures against the width that was asked for, and names what
// sticks out.
import { readdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const B = process.env.KURA_URL ?? "http://localhost:3000";
const widths = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["1440", "1024", "768", "390", "390t"];
const slugs = readdirSync(new URL("../../packages/react/src/components", import.meta.url)).filter(
  (slug) => slug !== "shader-canvas",
);
const pages = [
  "/",
  "/components",
  ...slugs.map((slug) => `/components/${slug}`),
  "/docs",
  "/docs/wiring-events",
  "/docs/hooks",
  "/agents",
];

const b = await chromium.launch();
let bad = 0;
for (const spec of widths) {
  const touch = spec.endsWith("t");
  const width = Number.parseInt(spec, 10);
  const ctx = await b.newContext({
    viewport: { width, height: 900 },
    hasTouch: touch,
    isMobile: touch,
  });
  const p = await ctx.newPage();
  for (const path of pages) {
    await p.goto(B + path, { waitUntil: "networkidle" });
    await p.waitForTimeout(400);
    const found = await p.evaluate((vw) => {
      const over = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - vw;
      if (over <= 1) return null;
      // Something inside its own scroller or clip is not what widens the page.
      const contained = (el) => {
        for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
          if (getComputedStyle(a).overflowX !== "visible") return true;
        }
        return false;
      };
      const who = [...document.querySelectorAll("body *")]
        .filter((el) => el.getBoundingClientRect().right > vw + 1 && !contained(el))
        .slice(0, 3)
        .map(
          (el) => `<${el.tagName.toLowerCase()}> "${(el.textContent ?? "").trim().slice(0, 48)}"`,
        );
      return { over: Math.round(over), who };
    }, width);
    if (found) {
      bad++;
      console.log(`OVERFLOW ${spec} ${path} +${found.over}px  ${found.who.join("  |  ")}`);
    }
  }
  await ctx.close();
}
await b.close();
console.log(
  bad
    ? `${bad} page(s) scroll sideways`
    : `no overflow: ${pages.length} pages at ${widths.join(", ")}`,
);
process.exit(bad ? 1 : 0);
