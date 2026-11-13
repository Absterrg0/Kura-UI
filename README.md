<div align="center">

<img src="apps/docs/public/logo.svg" width="48" alt="Kura" />

# Kura UI

**Components for agent interfaces.**

[kuro.abstergo.fyi](https://kuro.abstergo.fyi)

Open-source React components for agent runs, plans, terminals, diffs and approvals, drawn in one
dot language and built on Vercel's UI SDK. Copy them into your app, or let your coding agent
**find, read and install them** itself.

React 19 · Tailwind CSS v4 · motion · ui-sdk · TypeScript strict · MIT

</div>

---

## Why Kura

- **AI-native surfaces, not another button kit.** Thinking states, tool calls, approvals, voice,
  token meters, citations, shaders — the parts every AI product rebuilds badly.
- **Agents are first-class users.** Every component ships a typed manifest (`*.meta.ts`): when to
  use it, when _not_ to, props with JSON Schema, anatomy, a11y and keyboard map, dependencies and
  examples. CI fails if the manifest drifts from the TypeScript.
- **One source, many surfaces.** The docs, the shadcn registry, `llms.txt`, a JSON catalog, an MCP
  server and a CLI are all generated from the manifests — they cannot disagree.
- **A design language with opinions.** [The dot language](./DESIGN.md): agents emit tokens, so
  everything measured or stateful is drawn in dots. Status is a dot glyph, every agent has a dot
  sigil for a face, progress is a row of dots, and the one colour (ember) means "this needs you".
- **Serious library hygiene.** Accessible (axe in every test), SSR-safe, tree-shakeable per-component
  entry points with `"use client"` only where needed, dark mode via tokens, Vitest + Playwright, Biome, changesets, CI.

## Install

**npm**

```bash
npm install @kura-ui/react
```

```css
/* app/globals.css */
@import "tailwindcss";
@import "@kura-ui/react/styles.css";
```

```tsx
import { ShimmerText } from "@kura-ui/react/shimmer-text";

export const Status = () => <ShimmerText>Thinking…</ShimmerText>;
```

**Copy the source (shadcn-compatible)**

```bash
npx shadcn@latest add https://kuro.abstergo.fyi/r/kura-theme.json   # tokens, once
npx shadcn@latest add https://kuro.abstergo.fyi/r/shimmer-text.json
# or
npx @kura-ui/cli add shimmer-text
```

## For agents

| Surface    | Where                                                                                                                                                                                                           |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MCP server | `claude mcp add kura -- npx -y @kura-ui/mcp` · tools: `list_components`, `search_components`, `get_component`, `get_component_source`, `get_install_instructions`, `get_design_tokens`, `get_design_guidelines` |
| CLI        | `npx @kura-ui/cli search "show the model is thinking" --json`                                                                                                                                                   |
| llms.txt   | `/llms.txt`, `/llms-full.txt`, and `/components/<slug>.md` for every page                                                                                                                                       |
| Catalog    | `/registry/index.json` — every manifest, JSON-Schema props, examples, source, tokens                                                                                                                            |
| Registry   | `/r/<slug>.json` (shadcn registry-item schema)                                                                                                                                                                  |
| Skill      | [`skills/kura-ui/SKILL.md`](./skills/kura-ui/SKILL.md) · Cursor rule in `.cursor/rules/`                                                                                                                        |

## What's inside

| Package                              |                                                                                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`@kura-ui/react`](./packages/react) | The components, hooks (`useAudioAnalyser`, `useMediaRecorder`, `useSpeechRecognition`, `useHotkey`, …), tokens and the `ShaderCanvas` WebGL2 primitive |
| [`@kura-ui/mcp`](./packages/mcp)     | MCP server over the catalog                                                                                                                            |
| [`@kura-ui/cli`](./packages/cli)     | `kura list · search · info · add · init · doctor`                                                                                                      |
| [`apps/docs`](./apps/docs)           | The docs and showcase (Next.js), generated from the manifests                                                                                          |

## Develop

```bash
pnpm install
pnpm dev                       # docs on :3000
pnpm new my-widget --category agent
pnpm check                     # generate · validate:meta · lint · typecheck · test
pnpm build
```

Contributors (human or agent): read [AGENTS.md](./AGENTS.md) and [DESIGN.md](./DESIGN.md). See
[CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE)
