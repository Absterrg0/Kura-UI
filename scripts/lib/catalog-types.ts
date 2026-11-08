/**
 * Types for the generated catalog (`apps/docs/public/registry/index.json`), shared by the docs,
 * the MCP server and the CLI. Source of truth for meta fields: packages/react/src/lib/define-component.ts
 */
import type {
  ComponentMeta,
  ExampleMeta,
  HookMeta,
} from "../../packages/react/src/lib/define-component";

export type { ComponentMeta, ExampleMeta, HookMeta };

export interface CatalogFile {
  /** Path inside the user's project, relative to the alias root (e.g. "components/kura/kbd/kbd.tsx"). */
  target: string;
  /** shadcn registry file type. */
  type: "registry:ui" | "registry:hook" | "registry:lib";
  /** Source with imports rewritten to `@/…` aliases (shadcn convention). */
  content: string;
}

export interface CatalogExample extends ExampleMeta {
  /** Copy-pasteable code using npm imports (`@kura-ui/react/<slug>`). */
  code: string;
}

export interface JsonSchemaProp {
  type?: string | string[];
  enum?: unknown[];
  description: string;
  default?: unknown;
  "x-ts-type": string;
}

export interface CatalogComponent extends Omit<ComponentMeta, "examples"> {
  title: string;
  /** npm import path. */
  importPath: string;
  /** Exported names from the npm entry point. */
  exports: string[];
  docsUrl: string;
  markdownUrl: string;
  registryUrl: string;
  install: {
    shadcn: string;
    cli: string;
    npm: string;
  };
  /** Kura registry items (components, hooks, libs) this item needs, by registry name. */
  registryDependencies: string[];
  propsJsonSchema: {
    type: "object";
    properties: Record<string, JsonSchemaProp>;
    required: string[];
    additionalProperties: boolean;
  };
  examples: CatalogExample[];
  files: CatalogFile[];
}

export interface CatalogHook extends HookMeta {
  registryUrl: string;
  importPath: string;
  files: CatalogFile[];
}

export interface CatalogCategory {
  id: ComponentMeta["category"];
  title: string;
  description: string;
}

export interface DesignTokens {
  /** Static @theme tokens (fonts, radii, easing, animations). */
  theme: Record<string, string>;
  light: Record<string, string>;
  dark: Record<string, string>;
  /** Tailwind utility names available, grouped. */
  utilities: Record<string, string[]>;
  motion: {
    springs: Record<string, unknown>;
    durations: Record<string, number>;
    easings: Record<string, readonly number[]>;
  };
}

export interface Catalog {
  name: "kura-ui";
  version: string;
  homepage: string;
  description: string;
  install: {
    npm: string;
    css: string;
    shadcnTheme: string;
    cliInit: string;
  };
  categories: CatalogCategory[];
  components: CatalogComponent[];
  hooks: CatalogHook[];
  /** Shared lib modules (registry:lib items `kura-<name>`), e.g. keys, motion, merge-refs. */
  libs: Array<{ name: string; registryUrl: string; files: CatalogFile[] }>;
  tokens: DesignTokens;
}
