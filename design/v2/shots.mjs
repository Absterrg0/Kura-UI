// Fixed council screenshot set. Usage: node council/shots.mjs <outDir>
import { chromium } from "@playwright/test";

const out = process.argv[2];
const B = process.env.KURA_URL ?? "http://localhost:3000";
const SHOTS = [
  ["01-home-dark-1440-open", "/", "dark", 1440, 900, { at: 1200 }],
  ["02-home-dark-1440-gate", "/", "dark", 1440, 900, { gate: true }],
  ["03-home-light-1440-gate", "/", "light", 1440, 900, { gate: true }],
  ["04-home-dark-1440-full", "/", "dark", 1440, 900, { gate: true, full: true }],
  ["05-home-light-390-gate", "/", "light", 390, 844, { gate: true }],
  ["06-components-dark-1440", "/components", "dark", 1440, 900, {}],
  ["07-components-light-390", "/components", "light", 390, 844, {}],
  ["08-approval-prompt-dark-1440", "/components/approval-prompt", "dark", 1440, 900, {}],
  ["09-diff-view-light-1440-full", "/components/diff-view", "light", 1440, 900, { full: true }],
  ["10-docs-dark-1440", "/docs", "dark", 1440, 900, {}],
  ["11-wiring-light-1440", "/docs/wiring-events", "light", 1440, 900, {}],
  ["12-agents-dark-1440", "/agents", "dark", 1440, 900, {}],
  ["13-hooks-light-390", "/docs/hooks", "light", 390, 844, {}],
  ["14-cmdk-dark-1440", "/components", "dark", 1440, 900, { cmdk: "approve" }],
];
const b = await chromium.launch();
for (const [name, path, theme, w, h, o] of SHOTS) {
  const ctx = await b.newContext({
    viewport: { width: w, height: h },
    colorScheme: theme,
    deviceScaleFactor: 1,
  });
  await ctx.addInitScript((t) => localStorage.setItem("theme", t), theme);
  const p = await ctx.newPage();
  await p.goto(B + path, { waitUntil: "networkidle" });
  if (o.gate)
    await p
      .waitForFunction(() => document.documentElement.dataset.run === "attention", null, {
        timeout: 20000,
      })
      .catch(() => {});
  await p.waitForTimeout(o.at ?? 900);
  if (o.full) {
    await p.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 90));
      }
      window.scrollTo(0, 0);
    });
    await p.waitForTimeout(400);
  }
  if (o.cmdk) {
    await p.keyboard.press("Control+k");
    await p.waitForTimeout(300);
    await p.keyboard.type(o.cmdk);
    await p.waitForTimeout(400);
  }
  await p.screenshot({ path: `${out}/${name}.jpg`, type: "jpeg", quality: 70, fullPage: !!o.full });
  await ctx.close();
}
await b.close();
console.log("ok");
