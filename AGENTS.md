# AGENTS.md — working on Kura UI

You are working on **Kura UI**, an agent-first React 19 + Tailwind CSS v4 library of AI-native
components. Read this file fully before changing anything. Read `DESIGN.md` before designing
anything.

## Repo map

```
packages/react/                @kura-ui/react — the library
  src/components/<slug>/       one folder per component (THE unit of work)
  src/hooks/                   shared hooks (+ hooks.meta.ts, hooks.test.tsx)
  src/lib/                     cn, keys, motion presets, merge-refs, defineComponent types
  src/styles/kura.css          design tokens (Tailwind v4 @theme) — source of truth for color/motion
  test/utils.tsx               render, axe, setReducedMotion, setApplePlatform, userEvent
  scripts/build.ts             tsdown unbundled build (one file per module, "use client" kept)
packages/mcp/                  @kura-ui/mcp — stdio MCP server over the generated catalog
packages/cli/                  @kura-ui/cli — `kura list|search|info|add|init|doctor` (--json)
apps/docs/                     Next.js 16 docs; pages generated from the catalog
scripts/                       generate.ts, validate-meta.ts, new-component.ts, dev.ts, lib/
skills/kura-ui/SKILL.md        skill for agents that *use* Kura in other projects
DESIGN.md                      the Kura Signal design language (tokens, motion, anti-patterns)
```

Generated (gitignored, never edit, never commit): `registry.json`, `apps/docs/public/{r,registry,components,llms*.txt}`,
`apps/docs/src/generated/`, `packages/{mcp,cli}/data/`. `pnpm generate` rebuilds all of them.

## Commands

| Command                                                              | What it does                                                                                              |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `pnpm install`                                                       | Install (Node ≥ 24, pnpm 12)                                                                              |
| `pnpm dev`                                                           | Generate + docs at :3000, regenerating when component folders change                                      |
| `pnpm new <slug> --category <id>`                                    | Scaffold a component folder with all five files                                                           |
| `pnpm generate`                                                      | Rebuild docs index, registry, llms files, catalog, MCP/CLI data                                           |
| `pnpm validate:meta`                                                 | Contract check for every component folder (see below)                                                     |
| `pnpm --filter @kura-ui/react test`                                  | Library tests (Vitest + Testing Library + axe)                                                            |
| `pnpm --filter @kura-ui/react exec vitest run src/components/<slug>` | Tests for one component                                                                                   |
| `pnpm lint` / `pnpm lint:fix`                                        | Biome                                                                                                     |
| `pnpm typecheck`                                                     | tsc for every package                                                                                     |
| `pnpm check`                                                         | generate + validate:meta + lint + typecheck + test — must be green before you commit                      |
| `pnpm build`                                                         | Library, MCP, CLI, docs                                                                                   |
| `pnpm build:site`                                                    | Static export of the docs to `apps/docs/out` — what Cloudflare Pages deploys to https://kuro.abstergo.fyi |
| `pnpm test:visual`                                                   | Playwright screenshots of every component page, light + dark (needs `pnpm build` first, or `PW_DEV=1`)    |

## Add a component — the checklist

**One component = one new folder. Do not edit any shared file** (no index files, no package.json
exports, no docs pages, no registry). Everything is discovered from the folder.

1. `pnpm new <slug> --category <primitives|input|voice|conversation|agent|feedback|effects>`
   creates `packages/react/src/components/<slug>/`:
   - `<slug>.tsx` — implementation
   - `<slug>.meta.ts` — manifest (`export default defineComponent({...})`)
   - `<slug>.examples.tsx` — named example components (`<Name>Minimal`, `<Name>Full`, `<Name>Composition`, …)
   - `<slug>.test.tsx` — tests
   - `index.ts` — `export { Name, type NameProps, ...parts } from "./<slug>";`
     You may add more files to the folder (e.g. `shaders.ts`, `use-<slug>-state.ts`, `<slug>-item.tsx`); they ship too.
2. Implement. Rules:
   - Named exports only. Props interface named `<Name>Props`, exported, extending the root element's
     props (`React.ComponentProps<"div">`, omitting what you redefine). React 19: `ref` is a normal prop — spread `...props` onto the root (or `mergeRefs` if you need your own ref).
   - Root renders `data-slot="<slug>"`; parts render `data-slot="<slug>-<part>"`; expose state as data attributes (`data-state`, `data-status`, …).
   - Merge classes with `cn(base, conditional, className)` — `className` always last.
   - `"use client"` at the top of any file that uses hooks, refs, effects or event handlers. Server-safe components (pure render) omit it.
   - Imports: relative only. `../../lib/cn`, `../../lib/motion`, `../../hooks/use-x` (a specific file, never the hooks barrel), `../button` for other components. Never import `@kura-ui/react` inside the library.
   - Controlled + uncontrolled via `useControllableState` (`value`/`defaultValue`/`onValueChange`, `open`/`defaultOpen`/`onOpenChange`).
   - Style only with Kura tokens: `bg-kura-*`, `text-kura-*`, `border-kura-*`, `shadow-kura-*`, `rounded-kura-*`, `font-kura-*`, `ease-kura-*`, `duration-(--kura-duration-*)`, `animate-kura-*`. **No hex/rgb colors, no `dark:` variants**, no outer margins, no fixed widths on the root.
   - Motion: CSS transitions or `motion/react` with `springs.*` from `../../lib/motion`. Respect reduced motion (`motion-reduce:*` classes, or `useReducedMotion()`).
   - Icons: `lucide-react`. Popover/tooltip/dialog behaviour: reuse Kura `Popover`/`Tooltip` or `radix-ui` primitives.
   - Audio: `useAudioAnalyser` (+ `simulate` for demos/tests), `useMediaRecorder`, `useSpeechRecognition`. GPU: build on `ShaderCanvas`.
3. Fill the meta honestly (validation fails while any `TODO` remains). Write for an agent that has
   never seen the library: concrete `whenToUse`, `whenNotToUse` that names alternative slugs, every
   own prop, anatomy with data-slots, a11y notes + keyboard map + reduced-motion behaviour,
   `dependencies.npm` / `dependencies.kura` exactly matching the imports, ≥ 3 tags, examples with at
   least a `minimal` and a `full` (add a `composition`), and `agentNotes` for gotchas.
4. Examples: real, beautiful, self-contained usage. They become the docs previews, the copy-paste
   code (imports are rewritten to `@kura-ui/react/<slug>`), the MCP examples, and test fixtures.
   Non-exported top-level helpers (shader strings, sample data) used by an example are inlined into its code automatically.
5. Tests (all required by `validate:meta`): render + `data-slot`, interaction (userEvent/fireEvent),
   controlled/uncontrolled if applicable, `axe()` on every example, and a reduced-motion test
   (`setReducedMotion(true)`). jsdom has no WebGL/Web Audio: assert graceful fallbacks.
6. Run: `pnpm generate && pnpm validate:meta && pnpm --filter @kura-ui/react exec vitest run src/components/<slug> && pnpm lint && pnpm typecheck`.
   Then look at it: `pnpm dev` → http://localhost:3000/components/<slug>, light and dark, with reduced motion on.
7. Commit only your folder (plus a changeset via `pnpm changeset` if you like). Never commit generated files.

## What `pnpm validate:meta` enforces

- the five files exist; slug is kebab-case and not reserved (`utils`, `hooks`, `styles`, `lib`, `index`)
- meta matches the zod schema; `meta.slug` = folder; `index.ts` exports `Name` and `NameProps`
- **props ⇔ TypeScript**: every prop declared in your folder is documented; every meta prop exists; required flags match; string-literal unions and primitive types match
- part props listed in meta exist on `<Part>Props`
- examples named in meta are exported; `minimal` and `full` kinds exist
- `dependencies.npm` and `dependencies.kura` equal the actual imports of shipped files
- `"use client"` present where hooks are called; `data-slot="<slug>"` present; no hooks-barrel or self-package imports
- tests call `axe(`, cover reduced motion, and render the examples; no `TODO` left in meta

## Quality bar

A component is done when it is: beautiful in light and dark; keyboard-complete with visible focus;
screen-reader sensible (names, roles, live regions that do not spam); calm under reduced motion;
SSR-safe (no `window` at module scope or during render); free of layout shift; composable
(`className`, `ref`, data attributes, compound parts); documented so an agent can use it without
reading the source; and green on `pnpm check`.
