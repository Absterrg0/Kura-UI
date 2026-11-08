import { existsSync } from "node:fs";
import { chromium, defineConfig } from "@playwright/test";

/**
 * Visual smoke tests: every component page in light + dark. Screenshots go to
 * .screenshots/ (gitignored, uploaded as a CI artifact). Uses the bundled Playwright Chromium,
 * or PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH / a system Chromium; skips if none is available.
 */
function resolveChromium(): string | undefined {
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    (() => {
      try {
        return chromium.executablePath();
      } catch {
        return undefined;
      }
    })(),
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
  ];
  return candidates.find((p): p is string => !!p && existsSync(p));
}

const executablePath = resolveChromium();
process.env.KURA_PW_BROWSER = executablePath ?? "";
const port = Number(process.env.PORT ?? 3100);
const useDev = process.env.PW_DEV === "1";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: true,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    launchOptions: executablePath ? { executablePath } : {},
    viewport: { width: 1280, height: 900 },
  },
  webServer: executablePath
    ? {
        command: useDev
          ? `pnpm exec next dev --port ${port}`
          : `pnpm exec next start --port ${port}`,
        url: `http://localhost:${port}`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
});
