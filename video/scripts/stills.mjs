// Renders chosen frames of the film to out/stills/f<frame>.png from one bundle and one browser.
// Usage: node scripts/stills.mjs 60 200 330 …   (or --every 60 for a frame every second)
import { mkdirSync } from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";

const args = process.argv.slice(2);
const root = process.cwd();
const every = args[0] === "--every" ? Number(args[1]) : 0;
const scale = Number(process.env.SCALE ?? 1);

const { webpackOverride } = await import(path.join(root, "scripts/webpack-override.mjs"));
const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts"), webpackOverride });
const browser = await openBrowser("chrome");
const composition = await selectComposition({
  serveUrl,
  id: "KuraLaunchSilent",
  puppeteerInstance: browser,
});
const frames = every
  ? Array.from({ length: Math.ceil(composition.durationInFrames / every) }, (_, i) => i * every)
  : args.map(Number);
mkdirSync(path.join(root, "out/stills"), { recursive: true });
const queue = [...frames];
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const frame = queue.shift();
      await renderStill({
        serveUrl,
        composition,
        frame,
        output: path.join(root, `out/stills/f${String(frame).padStart(4, "0")}.png`),
        puppeteerInstance: browser,
        scale,
      });
    }
  }),
);
await browser.close({ silent: true });
console.log(`rendered ${frames.length} stills`);
