---

name: kura-ui
description: Use when building AI product UI in React (chat, prompt composer, voice/dictation, audio waveform, agent status, tool calls, reasoning, approvals, token/context meters, citations, shaders or gradients) with Kura UI (@kura-ui/react). Covers picking the right component, installing it correctly, and composing it with Kura design tokens.
---

# Using Kura UI

Kura UI is a React 19 + Tailwind CSS v4 library of AI-native components. Every component has a
manifest with `whenToUse`, `whenNotToUse`, props, a11y notes and examples. **Never guess an API —
read the manifest.**

## 1. Find the component

Prefer, in order:

1. MCP (if the `kura` server is connected): `search_components({ query })` → `get_component({ slug })`.
2. CLI: `npx @kura-ui/cli search "<need>" --json` → `npx @kura-ui/cli info <slug> --json`.
3. HTTP: `https://kura-ui.dev/llms.txt` (index) → `https://kura-ui.dev/components/<slug>.md`.

Read `whenNotToUse` before choosing — it names the better alternative when there is one.

## 2. Check the project once

`npx @kura-ui/cli doctor --json`. Kura needs React 19 and Tailwind v4 (`@import "tailwindcss"` in the
global CSS). If `tokens` fails, run `npx @kura-ui/cli init` (copy-in) or add
`@import "@kura-ui/react/styles.css";` after Tailwind (npm).

## 3. Install — pick ONE style per project

- **npm package** (default for apps): `npm i @kura-ui/react`, import per component:
  `import { ShimmerText } from "@kura-ui/react/shimmer-text"`. Hooks: `@kura-ui/react/hooks`. Utils: `@kura-ui/react/utils`.
- **Copy source** (when the user wants to customise): `npx @kura-ui/cli add <slug...>` or
  `npx shadcn@latest add https://kura-ui.dev/r/<slug>.json`. Files land in
  `components/kura/<slug>/`; import from `@/components/kura/<slug>`.

Detect which one the project already uses (`@kura-ui/react` in package.json vs a `components/kura/`
folder) and stay consistent.

## 4. Use it correctly

- Start from the manifest's `minimal` example, then add props from the props table. Respect `required`.
- Controlled components use `value`/`onValueChange` or `open`/`onOpenChange`; otherwise use `default*`.
- Style surrounding UI with Kura tokens, not raw colors: `bg-kura-canvas`, `bg-kura-surface`,
  `text-kura-fg`, `text-kura-fg-muted`, `border-kura-border`, `shadow-kura-sm`, `rounded-kura-lg`.
  Never add `dark:` overrides — tokens handle dark mode under `.dark`.
- Use the accent (`bg-kura-accent`, `variant="accent"`) at most once per view, for AI activity.
- Customise with `className` (merged last) and target parts with `[data-slot=…]` selectors.
- Components with hooks already include `"use client"`; server components can render server-safe ones directly.
- Icon-only buttons: `<IconButton label="…" icon={<Icon />} />` — `label` is required.
- Shortcuts: write keys with `mod` (⌘ on Mac, Ctrl elsewhere): `shortcut={["mod","enter"]}`.
- Audio/voice: `useMediaRecorder` → `stream` → `useAudioAnalyser({ source: stream })`; use
  `simulate: true` for demos and tests. Speech: `useSpeechRecognition` (check `isSupported`).

## 5. Verify

Render it in light and dark mode, tab through it with the keyboard, and toggle reduced motion.
Follow the `agentNotes` in the manifest — they list known pitfalls.
