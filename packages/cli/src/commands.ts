import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import type { Catalog, CatalogFile } from "../../../scripts/lib/catalog-types";
import { listComponents, resolveClosure, searchComponents } from "../../../scripts/lib/search";
import { dataFile } from "./catalog";
import { detectProject, installedVersion, type ProjectInfo, rel } from "./project";

export interface Output {
  json: boolean;
  log: (line?: string) => void;
}

const CN_SOURCE = `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;

const bold = (s: string) => (process.stdout.isTTY ? `\x1b[1m${s}\x1b[0m` : s);
const dim = (s: string) => (process.stdout.isTTY ? `\x1b[2m${s}\x1b[0m` : s);
const green = (s: string) => (process.stdout.isTTY ? `\x1b[32m${s}\x1b[0m` : s);
const yellow = (s: string) => (process.stdout.isTTY ? `\x1b[33m${s}\x1b[0m` : s);
const red = (s: string) => (process.stdout.isTTY ? `\x1b[31m${s}\x1b[0m` : s);

function emit(out: Output, data: unknown, human: () => void) {
  if (out.json) out.log(JSON.stringify(data, null, 2));
  else human();
}

export function cmdList(catalog: Catalog, out: Output, opts: { category?: string; tag?: string }) {
  const items = listComponents(catalog, opts);
  emit(out, { total: items.length, components: items }, () => {
    for (const cat of catalog.categories) {
      const group = items.filter((i) => i.category === cat.id);
      if (!group.length) continue;
      out.log(bold(cat.title));
      for (const c of group) out.log(`  ${c.slug.padEnd(22)} ${dim(c.description)}`);
      out.log();
    }
  });
}

export function cmdSearch(catalog: Catalog, out: Output, query: string, limit = 8) {
  const results = searchComponents(catalog, query, limit);
  emit(out, { query, results }, () => {
    if (!results.length) return out.log(`No components match "${query}". Try \`kura list\`.`);
    for (const r of results)
      out.log(`${bold(r.slug.padEnd(22))} ${dim(`(${r.score})`)} ${r.description}`);
    out.log();
    out.log(dim(`Next: kura info ${results[0]!.slug}`));
  });
}

export function cmdInfo(catalog: Catalog, out: Output, slug: string) {
  const c = catalog.components.find((x) => x.slug === slug);
  if (!c) throw new Error(`Unknown component "${slug}". Run \`kura list\`.`);
  const { files, ...meta } = c;
  emit(out, { ...meta, files: files.map((f) => f.target) }, () => {
    out.log(`${bold(c.title)} ${dim(`(${c.slug} · ${c.category} · ${c.status})`)}`);
    out.log(c.description);
    out.log();
    out.log(bold("Use when"));
    for (const w of c.whenToUse) out.log(`  + ${w}`);
    out.log(bold("Avoid when"));
    for (const w of c.whenNotToUse) out.log(`  - ${w}`);
    out.log();
    out.log(bold("Props"));
    for (const p of c.props) {
      out.log(
        `  ${p.name}${p.required ? "*" : ""}: ${p.type}${p.default ? ` = ${p.default}` : ""}`,
      );
      out.log(`    ${dim(p.description)}`);
    }
    out.log();
    out.log(bold("Install"));
    out.log(`  kura add ${c.slug}`);
    out.log(`  ${c.install.shadcn}`);
    out.log();
    out.log(bold("Example"));
    out.log(c.examples.find((e) => e.kind === "minimal")?.code ?? "");
    out.log(dim(`Docs: ${c.docsUrl}`));
  });
}

function rewriteAlias(content: string, alias: string): string {
  return alias === "@/" ? content : content.replace(/(["'])@\//g, `$1${alias}`);
}

interface AddResult {
  written: string[];
  skipped: string[];
  npm: string[];
  installed: boolean;
  css: { file: string | null; imported: boolean };
  notes: string[];
}

export function cmdAdd(
  catalog: Catalog,
  out: Output,
  slugs: string[],
  opts: { cwd: string; overwrite: boolean; dryRun: boolean; install: boolean },
): AddResult {
  if (!slugs.length) throw new Error("Usage: kura add <slug...>");
  const project = detectProject(opts.cwd);
  const closure = resolveClosure(catalog, slugs);
  const files: CatalogFile[] = [
    ...closure.components.flatMap((c) => c.files),
    ...closure.hooks.flatMap((h) => catalog.hooks.find((x) => x.file === h)?.files ?? []),
    ...closure.libs.flatMap((l) => catalog.libs.find((x) => x.name === l)?.files ?? []),
  ];
  const result: AddResult = {
    written: [],
    skipped: [],
    npm: closure.npm,
    installed: false,
    css: { file: null, imported: false },
    notes: [],
  };

  const writeFile = (target: string, content: string, force = opts.overwrite) => {
    const abs = join(project.base, target);
    if (existsSync(abs) && !force) {
      result.skipped.push(rel(project, abs));
      return;
    }
    if (!opts.dryRun) {
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, content);
    }
    result.written.push(rel(project, abs));
  };

  const seen = new Set<string>();
  for (const f of files) {
    if (seen.has(f.target)) continue;
    seen.add(f.target);
    writeFile(f.target, rewriteAlias(f.content, project.alias));
  }
  // cn helper (shadcn convention)
  if (
    !existsSync(join(project.base, "lib/utils.ts")) &&
    !existsSync(join(project.base, "lib/utils.js"))
  ) {
    writeFile("lib/utils.ts", CN_SOURCE, false);
  }
  ensureTokens(project, opts.dryRun, result);

  if (opts.install && !opts.dryRun) {
    const missing = closure.npm.filter((d) => !installedVersion(project, d));
    if (missing.length) {
      const args = project.packageManager === "npm" ? ["install", ...missing] : ["add", ...missing];
      const r = spawnSync(project.packageManager, args, {
        cwd: project.root,
        stdio: out.json ? "ignore" : "inherit",
      });
      result.installed = r.status === 0;
      if (r.status !== 0)
        result.notes.push(`Install failed: run \`${project.packageManager} ${args.join(" ")}\``);
    } else {
      result.installed = true;
    }
  }

  emit(
    out,
    {
      project: { root: project.root, base: rel(project, project.base), alias: project.alias },
      ...result,
    },
    () => {
      for (const w of result.written) out.log(`${green("+")} ${w}`);
      for (const s of result.skipped)
        out.log(`${yellow("=")} ${s} ${dim("(exists; --overwrite to replace)")}`);
      out.log();
      out.log(`npm: ${result.npm.join(", ")}${opts.install ? "" : dim(" (skipped --no-install)")}`);
      if (result.css.file)
        out.log(
          `tokens: ${result.css.file}${result.css.imported ? "" : yellow(" — import it in your global CSS")}`,
        );
      for (const n of result.notes) out.log(yellow(n));
      out.log();
      for (const c of closure.components.filter((x) => slugs.includes(x.slug))) {
        out.log(`import { ${c.name} } from "${project.alias}components/kura/${c.slug}";`);
      }
    },
  );
  return result;
}

function ensureTokens(project: ProjectInfo, dryRun: boolean, result: AddResult) {
  const css = project.globalCss;
  const hasTokens = (text: string) =>
    /@kura-ui\/react\/styles\.css|kura\.css|--kura-accent/.test(text);
  if (css && hasTokens(readFileSync(css, "utf8"))) {
    result.css = { file: rel(project, css), imported: true };
    return;
  }
  const target = join(project.base, "styles/kura.css");
  const source = readFileSync(dataFile("kura.css"), "utf8").replace(
    /@source "\.\.\/";/,
    "/* (copied by `kura add`; your Tailwind setup already scans your sources) */",
  );
  if (!existsSync(target)) {
    if (!dryRun) {
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, source);
    }
    result.written.push(rel(project, target));
  }
  result.css.file = rel(project, target);
  if (css) {
    let importPath = relative(dirname(css), target).replaceAll("\\", "/");
    if (!importPath.startsWith(".")) importPath = `./${importPath}`;
    const text = readFileSync(css, "utf8");
    const next = text.replace(/(@import\s+["']tailwindcss["'];?)/, `$1\n@import "${importPath}";`);
    if (!dryRun) writeFileSync(css, next);
    result.css.imported = true;
    result.notes.push(`Added @import "${importPath}" to ${rel(project, css)}`);
  } else {
    result.notes.push(
      'No global CSS with @import "tailwindcss" found — import styles/kura.css after Tailwind yourself.',
    );
  }
}

export function cmdInit(catalog: Catalog, out: Output, opts: { cwd: string; dryRun: boolean }) {
  const project = detectProject(opts.cwd);
  const result: AddResult = {
    written: [],
    skipped: [],
    npm: ["clsx", "tailwind-merge"],
    installed: false,
    css: { file: null, imported: false },
    notes: [],
  };
  ensureTokens(project, opts.dryRun, result);
  if (!existsSync(join(project.base, "lib/utils.ts")) && !opts.dryRun) {
    mkdirSync(join(project.base, "lib"), { recursive: true });
    writeFileSync(join(project.base, "lib/utils.ts"), CN_SOURCE);
    result.written.push(rel(project, join(project.base, "lib/utils.ts")));
  }
  emit(out, { version: catalog.version, ...result }, () => {
    for (const w of result.written) out.log(`${green("+")} ${w}`);
    for (const n of result.notes) out.log(n);
    out.log(green("Kura is ready. Next: kura add <slug>"));
  });
  return result;
}

interface Check {
  id: string;
  status: "pass" | "warn" | "fail";
  message: string;
  fix?: string;
}

export function cmdDoctor(out: Output, opts: { cwd: string }): Check[] {
  const p = detectProject(opts.cwd);
  const checks: Check[] = [];
  const add = (c: Check) => checks.push(c);
  if (!p.packageJson)
    add({
      id: "package-json",
      status: "fail",
      message: "No package.json in this directory.",
      fix: "Run kura in your project root.",
    });
  const react = installedVersion(p, "react");
  add(
    react && /(^|[^\d])(19|[2-9]\d)/.test(react)
      ? { id: "react", status: "pass", message: `react ${react}` }
      : {
          id: "react",
          status: "fail",
          message: `React 19+ required (found ${react ?? "none"}).`,
          fix: "npm install react@19 react-dom@19",
        },
  );
  const tw = installedVersion(p, "tailwindcss");
  add(
    tw && /(^|[^\d])4/.test(tw)
      ? { id: "tailwind", status: "pass", message: `tailwindcss ${tw}` }
      : {
          id: "tailwind",
          status: "fail",
          message: `Tailwind CSS v4 required (found ${tw ?? "none"}).`,
          fix: "https://tailwindcss.com/docs/installation",
        },
  );
  const plugin = ["@tailwindcss/postcss", "@tailwindcss/vite", "@tailwindcss/cli"].find((d) =>
    installedVersion(p, d),
  );
  add(
    plugin
      ? { id: "tailwind-plugin", status: "pass", message: plugin }
      : {
          id: "tailwind-plugin",
          status: "warn",
          message: "No @tailwindcss/postcss or @tailwindcss/vite found.",
          fix: "npm install -D @tailwindcss/postcss",
        },
  );
  if (!p.globalCss) {
    add({
      id: "global-css",
      status: "fail",
      message: 'No CSS file with @import "tailwindcss" found.',
      fix: 'Add @import "tailwindcss"; to your global CSS.',
    });
  } else {
    add({ id: "global-css", status: "pass", message: rel(p, p.globalCss) });
    const text = readFileSync(p.globalCss, "utf8");
    const viaNpm = /@kura-ui\/react\/styles\.css/.test(text);
    const viaFile = /kura\.css/.test(text) || /--kura-accent/.test(text);
    add(
      viaNpm || viaFile
        ? {
            id: "tokens",
            status: "pass",
            message: viaNpm ? "@kura-ui/react/styles.css imported" : "Kura tokens imported",
          }
        : {
            id: "tokens",
            status: "fail",
            message: "Kura design tokens are not imported.",
            fix: 'Run `kura init` or add @import "@kura-ui/react/styles.css";',
          },
    );
    if (
      /tailwind\.config\.(js|ts|cjs|mjs)/.test(text) ||
      existsSync(join(p.root, "tailwind.config.js"))
    ) {
      add({
        id: "tailwind-config",
        status: "warn",
        message:
          "tailwind.config.js found — Kura uses CSS-first @theme tokens (v4). Keep JS config minimal.",
      });
    }
  }
  const hasCn =
    existsSync(join(p.base, "lib/utils.ts")) || existsSync(join(p.base, "lib/utils.js"));
  add(
    hasCn
      ? { id: "cn", status: "pass", message: `${rel(p, join(p.base, "lib/utils.ts"))}` }
      : {
          id: "cn",
          status: "warn",
          message: "No lib/utils (cn helper) — needed for copied components.",
          fix: "kura init",
        },
  );
  add({ id: "alias", status: "pass", message: `alias ${p.alias} → ${rel(p, p.base)}` });

  emit(out, { ok: !checks.some((c) => c.status === "fail"), checks }, () => {
    for (const c of checks) {
      const icon = c.status === "pass" ? green("✓") : c.status === "warn" ? yellow("!") : red("✗");
      out.log(`${icon} ${c.id.padEnd(16)} ${c.message}${c.fix ? dim(`  → ${c.fix}`) : ""}`);
    }
  });
  return checks;
}
