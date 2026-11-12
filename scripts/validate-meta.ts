/**
 * pnpm validate:meta — fails when a component folder breaks the contract:
 *   - required files: <slug>.tsx, <slug>.meta.ts, <slug>.examples.tsx, <slug>.test.tsx, index.ts
 *   - meta matches the zod schema and its slug/name match the folder and exports
 *   - meta props ⇔ TypeScript props (names, required flags, literal unions, primitive types)
 *   - examples listed in meta exist (and include a "minimal" and a "full" one)
 *   - dependencies.npm / dependencies.kura match the actual imports
 *   - "use client" present when hooks are used; data-slot present (written, or from a ui-sdk part
 *     or primitive of the same name); no hooks barrel imports
 *   - tests cover accessibility (axe) and reduced motion
 */
import { existsSync, readFileSync } from "node:fs";
import { relative } from "node:path";
import type { ComponentMeta, PropMeta } from "../packages/react/src/lib/define-component";
import {
  classifyImport,
  listComponentFolders,
  loadMeta,
  moduleExports,
  parseMetaType,
  readImports,
  readProps,
  type TsProp,
} from "./lib/analyze";
import { PLANNED_SLUGS, RESERVED_SLUGS, ROOT } from "./lib/config";

const IGNORED_PROPS = new Set(["ref", "key"]);
const errors: string[] = [];
const warnings: string[] = [];

const folders = listComponentFolders();
const known = new Set(folders.map((f) => f.slug));

function compareProps(
  where: string,
  metaProps: PropMeta[],
  tsProps: TsProp[] | null,
  typeName: string,
  file: string,
) {
  if (!tsProps) {
    errors.push(
      `${where}: export \`${typeName}\` (interface or type) from ${relative(ROOT, file)}`,
    );
    return;
  }
  const byName = new Map(tsProps.map((p) => [p.name, p]));
  const metaNames = new Set(metaProps.map((p) => p.name));
  for (const mp of metaProps) {
    const tp = byName.get(mp.name);
    if (!tp) {
      errors.push(`${where}: meta prop \`${mp.name}\` does not exist on ${typeName}`);
      continue;
    }
    if (!!mp.required !== tp.required) {
      errors.push(
        `${where}: prop \`${mp.name}\` is ${tp.required ? "required" : "optional"} in TS but ${mp.required ? "required" : "optional"} in meta`,
      );
    }
    const parsed = parseMetaType(mp.type);
    if (tp.literals && parsed.literals && tp.literals.join("|") !== parsed.literals.join("|")) {
      errors.push(
        `${where}: prop \`${mp.name}\` values differ — TS: ${tp.literals.join(" | ")}, meta: ${parsed.literals.join(" | ")}`,
      );
    }
    if (tp.base && parsed.base && tp.base !== parsed.base) {
      errors.push(`${where}: prop \`${mp.name}\` is ${tp.base} in TS but ${parsed.base} in meta`);
    }
    if (tp.literals && !parsed.literals && parsed.base) {
      errors.push(
        `${where}: prop \`${mp.name}\` is a union (${tp.literals.join(" | ")}) in TS but ${mp.type} in meta`,
      );
    }
  }
  for (const tp of tsProps) {
    if (tp.own && !IGNORED_PROPS.has(tp.name) && !metaNames.has(tp.name)) {
      errors.push(`${where}: TS prop \`${tp.name}\` (${tp.type}) is not documented in meta.props`);
    }
  }
}

const HOOK_CALL = /\b(use[A-Z]\w*|React\.use[A-Z]?\w*)\(/;

for (const folder of folders) {
  const tag = `[${folder.slug}]`;
  if (RESERVED_SLUGS.includes(folder.slug)) errors.push(`${tag} slug is reserved`);
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(folder.slug))
    errors.push(`${tag} folder must be kebab-case`);

  const missing = Object.entries(folder.files).filter(([, f]) => !existsSync(f));
  for (const [, f] of missing) errors.push(`${tag} missing file ${relative(ROOT, f)}`);
  if (missing.length) continue;

  const { meta, error } = await loadMeta(folder);
  if (error || !meta) {
    errors.push(`${tag} ${error}`);
    continue;
  }
  if (meta.slug !== folder.slug)
    errors.push(`${tag} meta.slug "${meta.slug}" must equal the folder name`);

  const exported = new Set(moduleExports(folder.files.index));
  if (!exported.has(meta.name)) errors.push(`${tag} index.ts must export ${meta.name}`);
  if (!exported.has(`${meta.name}Props`))
    errors.push(`${tag} index.ts must export type ${meta.name}Props`);

  // props
  compareProps(
    `${tag} ${meta.name}`,
    meta.props,
    readProps(folder.files.impl, `${meta.name}Props`, folder.dir),
    `${meta.name}Props`,
    folder.files.impl,
  );
  for (const part of meta.parts ?? []) {
    if (!part.props?.length) continue;
    const file =
      folder.shipped.find((f) => readProps(f, `${part.name}Props`, folder.dir)) ??
      folder.files.impl;
    const tsProps = readProps(file, `${part.name}Props`, folder.dir);
    // Parts: only check the props listed (parts often inherit many primitive props).
    if (!tsProps) {
      errors.push(`${tag} part ${part.name}: export ${part.name}Props to document its props`);
      continue;
    }
    compareProps(
      `${tag} ${part.name}`,
      part.props,
      tsProps.map((p) => ({ ...p, own: false })),
      `${part.name}Props`,
      file,
    );
  }

  // examples
  const exampleExports = new Set(moduleExports(folder.files.examples));
  for (const ex of meta.examples) {
    if (!exampleExports.has(ex.name))
      errors.push(`${tag} example ${ex.name} is not exported from ${folder.slug}.examples.tsx`);
  }
  for (const kind of ["minimal", "full"] as const) {
    if (!meta.examples.some((e) => e.kind === kind))
      errors.push(`${tag} needs an example with kind "${kind}"`);
  }
  if (!meta.examples.some((e) => e.kind === "composition")) {
    warnings.push(`${tag} consider a "composition" example showing it with other components`);
  }

  // imports / dependencies / directives
  const npm = new Set<string>();
  const kura = new Set<string>();
  let hasDataSlot = false;
  for (const file of folder.shipped) {
    const source = readFileSync(file, "utf8");
    const rel = relative(ROOT, file);
    if (
      source.includes(`data-slot="${folder.slug}"`) ||
      source.includes(`"data-slot": "${folder.slug}"`) ||
      // A root built on a ui-sdk part (or primitive) of the same name gets the slot from ui-sdk.
      source.includes(`from "@ui-sdk/react/${folder.slug}"`) ||
      source.includes(`name: "${folder.slug}"`) ||
      source.includes(`agentSurface("${folder.slug}"`)
    )
      hasDataSlot = true;
    const isClient = /^\s*(\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*["']use client["']/.test(source);
    if (!isClient && HOOK_CALL.test(source))
      errors.push(`${tag} ${rel} calls hooks but has no "use client" directive`);
    for (const ref of readImports(file)) {
      const target = classifyImport(file, ref);
      if (target.kind === "npm") {
        if (target.name === "@kura-ui/react")
          errors.push(`${tag} ${rel}: use relative imports inside the library, not @kura-ui/react`);
        else if (!ref.isTypeOnly) npm.add(target.name);
      }
      if (target.kind === "component") kura.add(target.slug);
      if (target.kind === "hooks-barrel")
        errors.push(`${tag} ${rel}: import ../../hooks/use-x directly, not the hooks barrel`);
      if (target.kind === "lib" && target.name === "index")
        errors.push(`${tag} ${rel}: import ../../lib/<file> directly, not lib/index`);
    }
  }
  if (!hasDataSlot) errors.push(`${tag} the root element must render data-slot="${folder.slug}"`);
  const same = (a: Set<string>, b: string[]) => a.size === b.length && b.every((x) => a.has(x));
  if (!same(npm, meta.dependencies.npm)) {
    errors.push(
      `${tag} dependencies.npm must be [${[...npm]
        .sort()
        .map((d) => `"${d}"`)
        .join(", ")}] (from imports), meta says [${meta.dependencies.npm.join(", ")}]`,
    );
  }
  if (!same(kura, meta.dependencies.kura)) {
    errors.push(
      `${tag} dependencies.kura must be [${[...kura]
        .sort()
        .map((d) => `"${d}"`)
        .join(", ")}] (from imports), meta says [${meta.dependencies.kura.join(", ")}]`,
    );
  }
  for (const dep of meta.dependencies.kura)
    if (!known.has(dep))
      errors.push(`${tag} dependencies.kura references unknown component "${dep}"`);
  for (const rel of meta.related ?? []) {
    if (!known.has(rel) && !PLANNED_SLUGS.includes(rel)) {
      warnings.push(`${tag} related "${rel}" is not a known or planned component`);
    }
  }

  // tests
  const test = readFileSync(folder.files.test, "utf8");
  if (!/\baxe\(/.test(test))
    errors.push(`${tag} ${folder.slug}.test.tsx must run axe() (accessibility)`);
  if (!/setReducedMotion|reduced motion/i.test(test))
    errors.push(`${tag} ${folder.slug}.test.tsx must cover reduced motion`);
  if (!new RegExp(`from "\\./${folder.slug}\\.examples"`).test(test)) {
    errors.push(
      `${tag} ${folder.slug}.test.tsx must render the examples from ./${folder.slug}.examples`,
    );
  }

  if (/\bTODO\b/.test(readFileSync(folder.files.meta, "utf8"))) {
    errors.push(`${tag} ${folder.slug}.meta.ts still contains TODO placeholders`);
  }

  // Meta quality nudges (warnings only)
  const metaTyped = meta as ComponentMeta;
  if (metaTyped.description.length > 160) warnings.push(`${tag} description is over 160 chars`);
}

for (const w of warnings) console.warn(`⚠ ${w}`);
if (errors.length) {
  console.error(`\n✗ validate:meta found ${errors.length} problem(s):\n`);
  for (const e of errors) console.error(`  • ${e}`);
  process.exit(1);
}
console.log(
  `✓ validate:meta: ${folders.length} components OK${warnings.length ? ` (${warnings.length} warnings)` : ""}`,
);
