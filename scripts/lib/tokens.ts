/** Parse packages/react/src/styles/kura.css into structured tokens (for MCP, registry, docs). */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import postcss, { type AtRule, type Rule } from "postcss";
import { durations, easings, springs } from "../../packages/react/src/lib/motion";
import type { DesignTokens } from "./catalog-types";
import { SRC } from "./config";

export interface ParsedCss {
  tokens: DesignTokens;
  /** shadcn registry `cssVars` + `css` for the kura-theme item. */
  registry: {
    cssVars: {
      theme: Record<string, string>;
      light: Record<string, string>;
      dark: Record<string, string>;
    };
    css: Record<string, unknown>;
  };
  source: string;
}

function decls(node: Rule | AtRule): Record<string, string> {
  const out: Record<string, string> = {};
  node.each((child) => {
    if (child.type === "decl") out[child.prop] = child.value.replace(/\s+/g, " ").trim();
  });
  return out;
}

function nodeToObject(node: Rule | AtRule): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  node.each((child) => {
    if (child.type === "decl") out[child.prop] = child.value.replace(/\s+/g, " ").trim();
    else if (child.type === "rule") out[child.selector] = nodeToObject(child);
    else if (child.type === "atrule") out[`@${child.name} ${child.params}`] = nodeToObject(child);
  });
  return out;
}

export function parseTokens(): ParsedCss {
  const source = readFileSync(join(SRC, "styles/kura.css"), "utf8");
  const root = postcss.parse(source);
  const theme: Record<string, string> = {};
  const themeInline: Record<string, string> = {};
  let light: Record<string, string> = {};
  let dark: Record<string, string> = {};
  const css: Record<string, unknown> = {};

  root.each((node) => {
    if (node.type === "atrule" && node.name === "theme") {
      const target = node.params.includes("inline") ? themeInline : theme;
      node.each((child) => {
        if (child.type === "decl") target[child.prop] = child.value.replace(/\s+/g, " ").trim();
        if (child.type === "atrule" && child.name === "keyframes") {
          css[`@keyframes ${child.params}`] = nodeToObject(child);
        }
      });
    } else if (node.type === "rule" && node.selector.trim() === ":root") {
      light = decls(node);
    } else if (node.type === "rule" && node.selector.includes(".dark")) {
      dark = decls(node);
    } else if (node.type === "atrule" && node.name === "media") {
      css[`@media ${node.params}`] = nodeToObject(node);
    }
  });

  const utilities: Record<string, string[]> = {
    colors: [],
    radius: [],
    shadow: [],
    font: [],
    ease: [],
    animate: [],
  };
  for (const key of [...Object.keys(theme), ...Object.keys(themeInline)]) {
    const m = key.match(/^--(color|radius|shadow|font|ease|animate)-(.+)$/);
    if (!m) continue;
    const [, ns, name] = m;
    const prefix = {
      color: "bg-|text-|border-",
      radius: "rounded-",
      shadow: "shadow-",
      font: "font-",
      ease: "ease-",
      animate: "animate-",
    }[ns as "color"];
    const group = ns === "color" ? "colors" : ns!;
    utilities[group]!.push(`${prefix}${name}`);
  }

  // light/dark: drop color-scheme from cssVars (it is not a custom property)
  const vars = (o: Record<string, string>) =>
    Object.fromEntries(
      Object.entries(o)
        .filter(([k]) => k.startsWith("--"))
        .map(([k, v]) => [k.slice(2), v]),
    );

  return {
    source,
    tokens: {
      theme: { ...theme, ...themeInline },
      light,
      dark,
      utilities,
      motion: { springs, durations, easings },
    },
    registry: {
      cssVars: { theme: vars({ ...theme, ...themeInline }), light: vars(light), dark: vars(dark) },
      css,
    },
  };
}
