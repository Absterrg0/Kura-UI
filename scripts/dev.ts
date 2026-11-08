/**
 * pnpm dev — generate, start the docs, and regenerate whenever a component folder changes
 * (new folder, meta, examples), so new components appear in the running docs automatically.
 */
import { spawn, spawnSync } from "node:child_process";
import { watch } from "node:fs";
import { join } from "node:path";
import { COMPONENTS_DIR, ROOT, SRC } from "./lib/config";

const generate = () => spawnSync("pnpm", ["generate"], { cwd: ROOT, stdio: "inherit" });
generate();

let timer: NodeJS.Timeout | undefined;
const schedule = (file: string | null) => {
  if (file && /\.test\.tsx?$/.test(file)) return;
  clearTimeout(timer);
  timer = setTimeout(generate, 250);
};
for (const dir of [COMPONENTS_DIR, join(SRC, "hooks"), join(SRC, "styles")]) {
  watch(dir, { recursive: true }, (_event, file) => schedule(file));
}

const next = spawn(
  "pnpm",
  ["--filter", "@kura-ui/docs", "exec", "next", "dev", "--port", process.env.PORT ?? "3000"],
  {
    cwd: ROOT,
    stdio: "inherit",
  },
);
next.on("exit", (code) => process.exit(code ?? 0));
for (const sig of ["SIGINT", "SIGTERM"] as const) process.on(sig, () => next.kill(sig));
