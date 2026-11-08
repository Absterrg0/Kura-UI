/**
 * The machine-readable component manifest. Every component folder has a `<slug>.meta.ts` that
 * default-exports `defineComponent({...})`. `pnpm generate` turns these into the docs, the shadcn
 * registry, llms.txt, the JSON catalog, the MCP server and the CLI. `pnpm validate:meta` checks
 * them against the real TypeScript props.
 *
 * Write every string for an agent that has never seen this library: concrete, specific, no hype.
 */

export type ComponentCategory =
  | "primitives"
  | "input"
  | "voice"
  | "conversation"
  | "agent"
  | "feedback"
  | "effects";

export type ComponentStatus = "experimental" | "beta" | "stable";

export interface PropMeta {
  /** Prop name exactly as in the TS interface. */
  name: string;
  /** TypeScript type as a readable string, e.g. `"sm" | "md" | "lg"` or `(value: string) => void`. */
  type: string;
  /** Default value as source text, e.g. `"md"`, `false`, `2`. Omit when there is none. */
  default?: string;
  /** Must match the TS interface (non-optional ⇔ required). */
  required?: boolean;
  description: string;
}

export interface PartMeta {
  /** Exported component name, e.g. `PopoverContent`. */
  name: string;
  description: string;
  /** Value of the `data-slot` attribute this part renders. */
  dataSlot?: string;
  /** Props specific to this part. Validated against `<Name>Props` when present. */
  props?: PropMeta[];
}

export interface KeyboardMeta {
  /** e.g. "Enter", "Escape", "Mod+K", "Tab" */
  keys: string;
  action: string;
}

export interface ExampleMeta {
  /** Named export in `<slug>.examples.tsx`. Its source is extracted automatically. */
  name: string;
  title: string;
  description?: string;
  /** minimal = smallest correct usage; full = every relevant prop; composition = with other components. */
  kind: "minimal" | "full" | "composition" | "variant" | "state";
}

export interface ComponentMeta {
  /** kebab-case folder name. Also the registry name and the npm subpath: `@kura-ui/react/<slug>`. */
  slug: string;
  /** Primary exported component name (PascalCase). */
  name: string;
  category: ComponentCategory;
  status: ComponentStatus;
  /** One line, ≤ 160 chars, starts with a noun phrase: "Animated gradient sweep for…". */
  description: string;
  /** Concrete situations, phrased so an agent can match a user request against them. */
  whenToUse: string[];
  /** Situations where something else is better — name the alternative slug when there is one. */
  whenNotToUse: string[];
  /** Props of the primary component. Must match `<Name>Props` exactly (own props). */
  props: PropMeta[];
  /** Compound parts / anatomy, in render order. */
  parts?: PartMeta[];
  a11y: {
    /** ARIA role(s) rendered, if any. */
    role?: string;
    notes: string[];
    keyboard?: KeyboardMeta[];
    /** What changes under prefers-reduced-motion. */
    reducedMotion: string;
  };
  dependencies: {
    /** npm packages imported by this component's files (not react/react-dom). Validated. */
    npm: string[];
    /** Other Kura component slugs this component imports. Validated. */
    kura: string[];
  };
  related?: string[];
  tags: string[];
  examples: ExampleMeta[];
  /** Gotchas and rules for coding agents using this component. */
  agentNotes?: string[];
}

export function defineComponent<const T extends ComponentMeta>(meta: T): T {
  return meta;
}

export interface HookMeta {
  name: string;
  /** File name in src/hooks without extension, e.g. `use-audio-analyser`. */
  file: string;
  description: string;
  signature: string;
  returns: string;
  notes?: string[];
  example: string;
  tags: string[];
}

export function defineHook<const T extends HookMeta>(meta: T): T {
  return meta;
}
