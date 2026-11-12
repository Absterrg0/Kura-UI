# Kura UI — design direction v2 ("Raycast-grade dark, components as the hero")

Kura UI is an open-source **React component library** for agent interfaces (runs, plans, subagent
fleets, terminals, per-hunk diff review, traces, approvals, browser sessions, prompt queues), with a
typed manifest per component plus a shadcn registry, MCP server and CLI so coding agents can install
components. The site must sell **a UI library**: beautiful components, easy install, great docs.

Reference feel: **raycast.com** — rich near-black, one vivid brand colour used in light and glow,
glossy, premium, polished product visuals, a floating pill nav, big confident sans headlines,
generous space. Supporting references for structure: linear.app (section rhythm), ui.shadcn.com and
ui.elevenlabs.io (a component library whose hero *is* the components).

## Rejected — never do these
- Marketing-speak headlines about "watching agents" (it is a UI library — say what it is).
- Wide/expanded display fonts, serif/italic display, paper/washi textures, brush strokes, mascots.
- Purple-to-pink "AI" gradients, sparkles, generic gradient blobs behind text.
- Dashboard clutter in the hero: toolbars, legends, eyebrow pills, stat chips, timelines, mono label soup.
- Tinting everything: glows/colour on chrome, coloured section bands, ambient washes on docs pages.
- Boxes inside boxes inside boxes.

## Brand
- **Canvas:** near-black `#07080a` (dark is the hero theme); surfaces `#0e0f12` / `#131418`;
  hairlines `rgba(255,255,255,.07–.10)`. Light mode: clean white/near-white, same structure, done
  properly but secondary.
- **One brand colour: Ember** — vivid orange `#ff6b2c` with a hot core `#ff8a3d` and a deep edge
  `#e8431f`. Used ONLY for brand light: the hero stage glow, the logo mark, primary-CTA focus/hover
  glow, the final CTA band, small brand moments. UI state colours stay the library's own (blue live,
  green done, red failed, amber waiting) — never re-tinted.
- **Type:** Geist only (Geist Mono for code). H1 64–72px / 600 / tracking −0.035em / 1.02 line-height;
  section H2 40–48px / 600 / −0.03em; body 16–18px; meta 13–14px. Sentence case everywhere.
- **Gloss:** cards have a 1px inner top highlight (`inset 0 1px 0 rgba(255,255,255,.06)`), a hairline
  border, a soft deep shadow, and on hero cards a subtle top-to-bottom surface gradient. That is the
  "glossy" — not glassmorphism, no backdrop blur except the nav.
- **Logo:** keep it simple and clean — an ember-filled rounded mark + "Kura" wordmark in Geist 600.

## Landing (apps/docs/src/app/page.tsx and components)
1. **Nav:** floating pill container (max-w ~1200, rounded-2xl, hairline, translucent dark + blur),
   logo left, links (Components, Docs, For agents, GitHub), ⌘K search, theme toggle, primary
   "Get started" button (light pill). Sticky.
2. **Hero:** centered.
   - H1: **"Components for agent interfaces."** (or a better, equally plain sentence that says it is a
     UI library for AI agent products — no "watch your agents work").
   - Sub (1–2 lines, ~18px, muted): "Open-source React components for agent runs, plans, terminals,
     diffs and approvals. Copy them into your app — or let your coding agent install them."
   - CTAs: light primary "Browse components", dark secondary "Get started".
   - Under the CTAs: a small mono install chip with copy: `npx shadcn@latest add …/run-header.json`.
3. **Hero stage (the wow):** directly under the hero copy, a wide rounded stage (~1240px, radius
   24px) with an **ember light** behind/below it (a large soft radial glow + a few blurred ember light
   streaks emerging from behind the stage, Raycast-like intensity, but shaped as our own — horizontal
   staggered spans like a trace waterfall). On the stage, a **composed bento of 5–6 LIVE Kura
   components**, each in a glossy card, sized for legibility at 1440:
   - centre-large: **ApprovalPrompt** (pending, high-risk) — the focal point;
   - left: **TaskList** (agent plan mid-run);
   - right: **AgentFleet** (subagents running);
   - bottom-wide: **DiffView** excerpt or **Terminal** streaming tests;
   - small: **ContextMeter** / **RunHeader** bar across the top of the stage.
   Use real examples from `@/generated/examples` or compose with real props. Calm motion only (the
   components' own live states); no scripted multi-phase hero machine, no toolbars, no legend.
   Each card can show its component name on hover as a quiet link to its page.
4. **Logos/trust strip (optional, honest):** "Works with" Claude Agent SDK · Vercel AI SDK · OpenAI
   Agents · shadcn/ui · Tailwind v4 — small monochrome text marks, no fake customer logos.
5. **Sections** (Linear rhythm: headline left 40–48px + paragraph right, then one big visual; ~160px
   between sections; no eyebrow labels):
   - **"Every part of the run."** — bento grid (2–3 rows) of feature cards, each a live component at
     legible scale with a one-line caption: Plan (TaskList), Terminal, Diff review (DiffView),
     Approvals (ApprovalPrompt), Trace (TraceWaterfall), Browser session, Prompt queue, Checkpoints.
     Varied card sizes (bento), glossy cards, ember only as a tiny accent on hover.
   - **"Your agent can install it."** — split: left copy (typed manifests, shadcn registry, MCP, CLI,
     llms.txt), right a glossy terminal card showing `claude mcp add kura -- npx -y @kura-ui/mcp` and
     a short agent exchange installing components.
   - **"Built right."** — 3–4 small cards: Accessible (keyboard maps, screen readers), Reduced-motion
     aware, Themeable tokens (light + dark), Copy-paste source you own.
   - **Final CTA band:** big centered headline, ember light behind, two buttons + install chip.
6. **Footer:** compact, 4 columns, hairline top, small logo.

## Components index (/components)
- Same nav. Header: H1 "Components" (40px, Geist 600) + one-line lede + group tabs and filter in one row.
- Grid of glossy cards (3 columns at xl): live preview at legible scale (no tiny specimens floating),
  name + one line. Supervision components first.

## Component page & docs (/components/[slug], /docs, /agents)
- Same nav + left sidebar. Clean, calm, Linear-docs-like: H1 40px Geist 600, lede, install command
  row, a glossy preview stage (dark) with tabs Preview/Code, then sections. No ambient washes, no
  decorative glows on docs pages. Code blocks: dark glossy panes.
- Keep all existing functionality (tabs, props tables, ⌘K, copy buttons, mobile nav if present).

## Mobile
- Composed, not shrunk: hero H1 ~40px, CTAs full width, hero stage becomes a vertical stack of 2–3
  key component cards (ApprovalPrompt first). Bento → single column. Nav → logo + menu button with a
  sheet.

## Quality bar
- axe: zero serious/critical; visible focus everywhere; reduced motion respected; no console errors;
  no horizontal overflow at 390px; one h1 per page; `pnpm check` green.
