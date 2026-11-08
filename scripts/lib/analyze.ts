/**
 * Loads every component folder and analyses it with the TypeScript compiler:
 * meta, props, examples source, imports (npm + Kura), and registry-ready file contents.
 * Shared by `pnpm generate` and `pnpm validate:meta`.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import type { ComponentMeta, HookMeta } from "../../packages/react/src/lib/define-component";
import { COMPONENTS_DIR, IMPLICIT_PACKAGES, REACT_DIR, SRC } from "./config";
import { componentMetaSchema, hookMetaSchema } from "./schema";

export interface ComponentFolder {
  slug: string;
  dir: string;
  files: {
    impl: string;
    meta: string;
    examples: string;
    test: string;
    index: string;
  };
  /** Implementation files shipped to users (everything except meta/examples/test). */
  shipped: string[];
}

export function listComponentFolders(): ComponentFolder[] {
  if (!existsSync(COMPONENTS_DIR)) return [];
  return readdirSync(COMPONENTS_DIR)
    .filter((name) => statSync(join(COMPONENTS_DIR, name)).isDirectory())
    .sort()
    .map((slug) => {
      const dir = join(COMPONENTS_DIR, slug);
      const shipped = readdirSync(dir)
        .filter((f) => /\.tsx?$/.test(f) && !/\.(meta|examples|test)\.tsx?$/.test(f))
        .sort()
        .map((f) => join(dir, f));
      return {
        slug,
        dir,
        files: {
          impl: join(dir, `${slug}.tsx`),
          meta: join(dir, `${slug}.meta.ts`),
          examples: join(dir, `${slug}.examples.tsx`),
          test: join(dir, `${slug}.test.tsx`),
          index: join(dir, "index.ts"),
        },
        shipped,
      };
    });
}

export async function loadMeta(folder: ComponentFolder): Promise<{
  meta?: ComponentMeta;
  error?: string;
}> {
  if (!existsSync(folder.files.meta)) return { error: `missing ${folder.slug}.meta.ts` };
  try {
    const mod = await import(pathToFileURL(folder.files.meta).href);
    const parsed = componentMetaSchema.safeParse(mod.default);
    if (!parsed.success) {
      return {
        error: parsed.error.issues
          .map((i) => `meta.${i.path.join(".")}: ${i.message}`)
          .join("\n    "),
      };
    }
    return { meta: parsed.data as ComponentMeta };
  } catch (err) {
    return { error: `failed to import meta: ${(err as Error).message}` };
  }
}

export async function loadHooks(): Promise<HookMeta[]> {
  const file = join(SRC, "hooks/hooks.meta.ts");
  if (!existsSync(file)) return [];
  const mod = await import(pathToFileURL(file).href);
  const hooks = mod.default as HookMeta[];
  for (const h of hooks) hookMetaSchema.parse(h);
  return hooks;
}

// ------------------------------------------------------------------------------------------------
// TypeScript program
// ------------------------------------------------------------------------------------------------

let program: ts.Program | undefined;

export function getProgram(): ts.Program {
  if (program) return program;
  const configPath = join(REACT_DIR, "tsconfig.json");
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, REACT_DIR);
  program = ts.createProgram({ rootNames: parsed.fileNames, options: parsed.options });
  return program;
}

function sourceFile(file: string): ts.SourceFile {
  const sf = getProgram().getSourceFile(file);
  if (!sf) throw new Error(`not in program: ${file}`);
  return sf;
}

export function moduleExports(file: string): string[] {
  const checker = getProgram().getTypeChecker();
  const sym = checker.getSymbolAtLocation(sourceFile(file));
  if (!sym) return [];
  return checker.getExportsOfModule(sym).map((s) => s.name);
}

export interface TsProp {
  name: string;
  required: boolean;
  /** Declared in this component's own folder (vs inherited from DOM/Radix/other Kura parts). */
  own: boolean;
  type: string;
  literals: string[] | null;
  base: "boolean" | "number" | "string" | null;
}

/** Props of an exported `XxxProps` interface/type in `file`. */
export function readProps(file: string, typeName: string, ownDir: string): TsProp[] | null {
  const checker = getProgram().getTypeChecker();
  const modSym = checker.getSymbolAtLocation(sourceFile(file));
  if (!modSym) return null;
  let sym = checker.getExportsOfModule(modSym).find((s) => s.name === typeName);
  if (!sym) return null;
  if (sym.flags & ts.SymbolFlags.Alias) sym = checker.getAliasedSymbol(sym);
  const type = checker.getDeclaredTypeOfSymbol(sym);
  return checker.getPropertiesOfType(type).map((p) => {
    const decls = p.getDeclarations() ?? [];
    const own = decls.some((d) => resolve(d.getSourceFile().fileName).startsWith(ownDir + sep));
    const decl = decls[0];
    const t = decl ? checker.getTypeOfSymbolAtLocation(p, decl) : checker.getTypeOfSymbol(p);
    const nonNullable = checker.getNonNullableType(t);
    let literals: string[] | null = null;
    let base: TsProp["base"] = null;
    const parts = nonNullable.isUnion() ? nonNullable.types : [nonNullable];
    if (parts.every((x) => x.isStringLiteral())) {
      literals = parts.map((x) => (x as ts.StringLiteralType).value).sort();
    } else if (parts.every((x) => x.flags & ts.TypeFlags.BooleanLike)) {
      base = "boolean";
    } else if (parts.length === 1 && parts[0]!.flags & ts.TypeFlags.Number) {
      base = "number";
    } else if (parts.length === 1 && parts[0]!.flags & ts.TypeFlags.String) {
      base = "string";
    }
    return {
      name: p.name,
      required: !(p.flags & ts.SymbolFlags.Optional),
      own,
      type: checker.typeToString(t),
      literals,
      base,
    };
  });
}

/** Literal set or base type expressed by a meta `type` string. */
export function parseMetaType(type: string): { literals: string[] | null; base: TsProp["base"] } {
  const parts = type.split("|").map((s) => s.trim());
  if (parts.length && parts.every((p) => /^"[^"]*"$/.test(p) || /^'[^']*'$/.test(p))) {
    return { literals: parts.map((p) => p.slice(1, -1)).sort(), base: null };
  }
  if (type === "boolean") return { literals: null, base: "boolean" };
  if (type === "number") return { literals: null, base: "number" };
  if (type === "string") return { literals: null, base: "string" };
  return { literals: null, base: null };
}

// ------------------------------------------------------------------------------------------------
// Imports
// ------------------------------------------------------------------------------------------------

export interface ImportRef {
  specifier: string;
  /** For relative imports: absolute path without extension. */
  resolved?: string;
  isTypeOnly: boolean;
  node: ts.StringLiteral;
}

export function readImports(file: string): ImportRef[] {
  const sf = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  const out: ImportRef[] = [];
  for (const stmt of sf.statements) {
    if (
      (ts.isImportDeclaration(stmt) || ts.isExportDeclaration(stmt)) &&
      stmt.moduleSpecifier &&
      ts.isStringLiteral(stmt.moduleSpecifier)
    ) {
      const specifier = stmt.moduleSpecifier.text;
      const isTypeOnly = ts.isImportDeclaration(stmt)
        ? !!stmt.importClause?.isTypeOnly
        : stmt.isTypeOnly;
      out.push({
        specifier,
        resolved: specifier.startsWith(".") ? resolve(dirname(file), specifier) : undefined,
        isTypeOnly,
        node: stmt.moduleSpecifier,
      });
    }
  }
  return out;
}

export function packageName(specifier: string): string {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0]!;
}

export type ImportTarget =
  | { kind: "npm"; name: string }
  | { kind: "cn" }
  | { kind: "lib"; name: string }
  | { kind: "hook"; name: string }
  | { kind: "hooks-barrel" }
  | { kind: "component"; slug: string; file?: string }
  | { kind: "local"; specifier: string }
  | { kind: "implicit" };

/** Classify an import from a file under packages/react/src. */
export function classifyImport(fromFile: string, ref: ImportRef): ImportTarget {
  if (!ref.resolved) {
    const name = packageName(ref.specifier);
    if (IMPLICIT_PACKAGES.includes(name)) return { kind: "implicit" };
    return { kind: "npm", name };
  }
  const rel = relative(SRC, ref.resolved).split(sep);
  if (rel[0] === "lib") {
    if (rel[1] === "cn") return { kind: "cn" };
    return { kind: "lib", name: rel[1] ?? "index" };
  }
  if (rel[0] === "hooks") {
    if (!rel[1] || rel[1] === "index") return { kind: "hooks-barrel" };
    return { kind: "hook", name: rel[1] };
  }
  if (rel[0] === "components" && rel[1]) {
    const ownSlug = relative(COMPONENTS_DIR, fromFile).split(sep)[0];
    if (rel[1] === ownSlug && dirname(fromFile) === join(COMPONENTS_DIR, rel[1])) {
      return { kind: "local", specifier: ref.specifier };
    }
    return { kind: "component", slug: rel[1], file: rel[2] };
  }
  return { kind: "local", specifier: ref.specifier };
}

/** Lib module names whose files ship as registry:lib items. */
export function listLibModules(): string[] {
  return readdirSync(join(SRC, "lib"))
    .filter((f) => f.endsWith(".ts") && f !== "index.ts" && !/\.(test|meta)\.ts$/.test(f))
    .map((f) => f.replace(/\.ts$/, ""))
    .filter((n) => n !== "cn");
}

export function listHookModules(): string[] {
  return readdirSync(join(SRC, "hooks"))
    .filter((f) => f.endsWith(".ts") && f !== "index.ts" && !/\.(test|meta)\.tsx?$/.test(f))
    .map((f) => f.replace(/\.ts$/, ""));
}

/** Registry item name for a lib module. */
export const libItemName = (name: string) => `kura-${name}`;

/**
 * Rewrite a source file for copy-in installation (shadcn / kura add):
 *   lib/cn            → @/lib/utils           (shadcn's cn)
 *   lib/<x>           → @/lib/kura/<x>
 *   hooks/<x>         → @/hooks/kura/<x>
 *   components/<s>    → @/components/kura/<s>
 * and report the registry dependencies it needs.
 */
export function rewriteForRegistry(file: string): {
  content: string;
  npm: Set<string>;
  registry: Set<string>;
  problems: string[];
} {
  let content = readFileSync(file, "utf8");
  const npm = new Set<string>();
  const registry = new Set<string>();
  const problems: string[] = [];
  const replacements: Array<[number, number, string]> = [];
  for (const ref of readImports(file)) {
    const target = classifyImport(file, ref);
    let next: string | null = null;
    switch (target.kind) {
      case "npm":
        if (!ref.isTypeOnly) npm.add(target.name);
        break;
      case "cn":
        next = "@/lib/utils";
        registry.add("utils");
        break;
      case "lib":
        if (target.name === "index") problems.push(`import a specific lib file, not lib/index`);
        next = `@/lib/kura/${target.name}`;
        registry.add(libItemName(target.name));
        break;
      case "hook":
        next = `@/hooks/kura/${target.name}`;
        registry.add(target.name);
        break;
      case "hooks-barrel":
        problems.push(`import a specific hook file (../../hooks/use-x), not the hooks barrel`);
        break;
      case "component":
        next = `@/components/kura/${target.slug}${target.file ? `/${target.file}` : ""}`;
        registry.add(target.slug);
        break;
      default:
        break;
    }
    if (next) {
      const start = ref.node.getStart() + 1;
      replacements.push([start, start + ref.specifier.length, next]);
    }
  }
  for (const [s, e, text] of replacements.sort((a, b) => b[0] - a[0])) {
    content = content.slice(0, s) + text + content.slice(e);
  }
  return { content, npm, registry, problems };
}

// ------------------------------------------------------------------------------------------------
// Examples
// ------------------------------------------------------------------------------------------------

/**
 * Source of each exported example function, with only the imports it uses, rewritten to npm
 * paths (`./shimmer-text` → `@kura-ui/react/shimmer-text`, `../button` → `@kura-ui/react/button`).
 */
export function extractExamples(file: string, slug: string): Map<string, string> {
  const text = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const imports: Array<{ names: string[]; line: string }> = [];
  const topLevel = new Map<string, string>();
  const examples = new Map<string, string>();

  const toNpm = (spec: string) => {
    if (!spec.startsWith(".")) return spec;
    const abs = resolve(dirname(file), spec);
    const rel = relative(SRC, abs).split(sep);
    if (rel[0] === "components") return `@kura-ui/react/${rel[1]}`;
    if (rel[0] === "hooks") return "@kura-ui/react/hooks";
    if (rel[0] === "lib") return "@kura-ui/react/utils";
    if (dirname(abs) === dirname(file)) return `@kura-ui/react/${slug}`;
    return spec;
  };

  for (const stmt of sf.statements) {
    if (ts.isImportDeclaration(stmt) && ts.isStringLiteral(stmt.moduleSpecifier)) {
      const clause = stmt.importClause;
      const names: string[] = [];
      if (clause?.name) names.push(clause.name.text);
      const nb = clause?.namedBindings;
      if (nb && ts.isNamespaceImport(nb)) names.push(nb.name.text);
      if (nb && ts.isNamedImports(nb)) for (const el of nb.elements) names.push(el.name.text);
      const spec = toNpm(stmt.moduleSpecifier.text);
      const raw = stmt.getText(sf).replace(stmt.moduleSpecifier.getText(sf), JSON.stringify(spec));
      imports.push({ names, line: raw });
      continue;
    }
    const isExported = (n: ts.Node) =>
      ts.canHaveModifiers(n) &&
      ts.getModifiers(n)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (ts.isFunctionDeclaration(stmt) && stmt.name) {
      if (isExported(stmt)) examples.set(stmt.name.text, stmt.getText(sf));
      else topLevel.set(stmt.name.text, stmt.getText(sf));
    } else if (ts.isVariableStatement(stmt)) {
      for (const d of stmt.declarationList.declarations) {
        if (ts.isIdentifier(d.name)) {
          if (isExported(stmt)) examples.set(d.name.text, stmt.getText(sf));
          else topLevel.set(d.name.text, stmt.getText(sf));
        }
      }
    }
  }

  const uses = (code: string, name: string) => new RegExp(`\\b${name}\\b`).test(code);
  const out = new Map<string, string>();
  for (const [name, body] of examples) {
    // Pull in non-exported helpers (shader strings, data) the example references, transitively.
    const helpers: string[] = [];
    let scan = body;
    let added = true;
    while (added) {
      added = false;
      for (const [hName, hBody] of topLevel) {
        if (!helpers.includes(hBody) && uses(scan, hName)) {
          helpers.push(hBody);
          scan += `\n${hBody}`;
          added = true;
        }
      }
    }
    const usedImports = imports
      .map((imp) => {
        const used = imp.names.filter((n) => uses(scan, n));
        if (!used.length) return null;
        if (used.length === imp.names.length) return imp.line;
        // narrow named imports to the used ones
        return imp.line.replace(/\{([^}]*)\}/, (_m, inner: string) => {
          const kept = inner
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s && used.some((u) => new RegExp(`\\b${u}$`).test(s)));
          return `{ ${kept.join(", ")} }`;
        });
      })
      .filter(Boolean);
    const needsClient = /\buse[A-Z]\w*\(|React\.use\w*\(|on[A-Z]\w*=\{/.test(scan);
    const code = [
      needsClient ? '"use client";\n' : "",
      usedImports.join("\n"),
      "",
      ...helpers.map((h) => `${h}\n`),
      body,
    ]
      .filter((s, i) => i !== 0 || s)
      .join("\n");
    out.set(name, `${code.trim()}\n`);
  }
  return out;
}
