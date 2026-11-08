import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadCatalog } from "./catalog";
import { cmdAdd, cmdDoctor, cmdInfo, cmdSearch, type Output } from "./commands";

let dir: string;
let logs: string[];
const out = (): Output => ({ json: true, log: (l = "") => logs.push(l) });
const last = () => JSON.parse(logs.at(-1)!);

beforeEach(() => {
  logs = [];
  dir = mkdtempSync(join(tmpdir(), "kura-cli-"));
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({
      dependencies: { react: "^19.0.0", next: "16.0.0" },
      devDependencies: { tailwindcss: "^4.1.0", "@tailwindcss/postcss": "^4.1.0" },
    }),
  );
  writeFileSync(
    join(dir, "tsconfig.json"),
    JSON.stringify({ compilerOptions: { paths: { "@/*": ["./src/*"] } } }),
  );
  mkdirSync(join(dir, "src/app"), { recursive: true });
  writeFileSync(join(dir, "src/app/globals.css"), '@import "tailwindcss";\n');
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("kura cli", () => {
  it("search returns ranked JSON", async () => {
    cmdSearch(await loadCatalog(), out(), "animated thinking text shimmer");
    expect(last().results[0].slug).toBe("shimmer-text");
  });

  it("info returns the manifest", async () => {
    cmdInfo(await loadCatalog(), out(), "kbd");
    expect(last().whenNotToUse.length).toBeGreaterThan(0);
  });

  it("doctor flags missing tokens, then add fixes them", async () => {
    let checks = cmdDoctor(out(), { cwd: dir });
    expect(checks.find((c) => c.id === "tokens")?.status).toBe("fail");

    const result = cmdAdd(await loadCatalog(), out(), ["kbd-shortcut"], {
      cwd: dir,
      overwrite: false,
      dryRun: false,
      install: false,
    });
    expect(result.written).toEqual(
      expect.arrayContaining([
        "src/components/kura/kbd-shortcut/kbd-shortcut.tsx",
        "src/components/kura/kbd/kbd.tsx",
        "src/hooks/kura/use-hotkey.ts",
        "src/hooks/kura/use-platform.ts",
        "src/lib/kura/keys.ts",
        "src/lib/utils.ts",
        "src/styles/kura.css",
      ]),
    );
    expect(readFileSync(join(dir, "src/app/globals.css"), "utf8")).toContain(
      '@import "../styles/kura.css";',
    );
    expect(
      readFileSync(join(dir, "src/components/kura/kbd-shortcut/kbd-shortcut.tsx"), "utf8"),
    ).toContain('from "@/hooks/kura/use-hotkey"');

    checks = cmdDoctor(out(), { cwd: dir });
    expect(checks.filter((c) => c.status === "fail")).toEqual([]);

    const again = cmdAdd(await loadCatalog(), out(), ["kbd-shortcut"], {
      cwd: dir,
      overwrite: false,
      dryRun: false,
      install: false,
    });
    expect(again.written).toEqual([]);
    expect(again.skipped.length).toBeGreaterThan(0);
  });

  it("rewrites the alias when the project uses ~/", async () => {
    writeFileSync(
      join(dir, "tsconfig.json"),
      JSON.stringify({ compilerOptions: { paths: { "~/*": ["./src/*"] } } }),
    );
    cmdAdd(await loadCatalog(), out(), ["icon-button"], {
      cwd: dir,
      overwrite: false,
      dryRun: false,
      install: false,
    });
    const src = readFileSync(join(dir, "src/components/kura/icon-button/icon-button.tsx"), "utf8");
    expect(src).toContain('from "~/components/kura/button"');
    expect(src).not.toContain('"@/');
  });

  it("errors on unknown slugs", async () => {
    expect(() =>
      cmdAdd({ components: [] } as never, out(), ["nope"], {
        cwd: dir,
        overwrite: false,
        dryRun: true,
        install: false,
      }),
    ).toThrow(/Unknown component/);
  });
});
