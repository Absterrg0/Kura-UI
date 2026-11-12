# Kura UI — design direction v3: the dot language

Kura UI is an open-source **React component library** for agent interfaces (runs, plans, subagent
fleets, terminals, per-hunk diff review, traces, approvals, browser sessions, prompt queues), built
on Vercel's UI SDK, with a typed manifest per component plus a shadcn registry, MCP server and CLI.

The owner approved this direction on 2026-11-13 after rejecting eight others. The reference
implementation is the lab page `apps/docs/src/app/lab/dots` (http://localhost:3047/lab/dots). The
library and the site must look and move like that page.

## The idea

Agents emit tokens. So in Kura, **everything measured or stateful is drawn in dots.** That one motif
is the identity; the rest is a quiet, crisp frame for it.

## The seven rules

1. **Status is a 5×5 dot glyph**, never an icon or a coloured pill.
   queued = hollow ring · running = a light chasing round the ring · waiting on a person = ember ring
   with a blinking centre · done = solid disc · failed = a cross · skipped = a dash · paused = two bars.
2. **Every agent has a face**: a symmetric 5×5 dot sigil generated from its name, in a small raised
   tile. Same name, same face. No letter avatars, no robot icons.
3. **Anything measured is a row of dots**: run progress, subagent progress, trace spans (a run of lit
   dots on a shared time axis), meters. Context is one hundred dots, one per percent. Property lists
   use dotted leaders. No solid progress bars.
4. **Ember means "this needs you" and nothing else.** It appears as a halftone (dots that shrink as
   they fade) in the top-right corner of the thing that needs a person, on its glyph and its label.
   When the person decides, ember leaves the screen. Never ember for decoration, hover, links or
   brand chrome inside components. On the site, the one allowed brand use is the logo tile and one
   halftone light behind the hero stage and the closing call to action.
5. **One way to draw an edge.** A sheet is a flat fill with one crisp 1px ring, a faint 1px halo
   outside it and an etched top edge; radius 14px. Wells (code, commands, terminals) are sunk:
   darker fill, inner shadow, radius 10px. Nothing else has a border. No glows, no blur, no grain,
   no gradients on surfaces, no boxes inside boxes beyond sheet → well.
6. **Buttons are keycaps**: raised, radius 9px, 32px tall, with the shortcut printed on the key in a
   small keycap. Primary is the ink fill (light on dark, dark on light). No pill buttons, no accent
   colour buttons.
7. **Monochrome ink.** Text is ink in three steps; green and red only for test results, diffs and
   failures; ember only per rule 4. There is no blue.

## Tokens (source of truth: `packages/react/src/styles/kura.css`)

|                                | dark                              | light                             |
| ------------------------------ | --------------------------------- | --------------------------------- |
| canvas                         | `#0c0d0f`                         | `#e8eaed`                         |
| sheet (surface)                | `#141518`                         | `#ffffff`                         |
| well (sunken)                  | `#0a0b0d`                         | `#f2f3f5`                         |
| raised (keys, tiles, popovers) | `#1e2024`                         | `#ffffff`                         |
| ink / ink-2 / ink-3            | `#f2f3f4` / `#a4a7ad` / `#878b92` | `#111214` / `#53565c` / `#62666d` |
| faint (decoration only)        | `#3a3d43`                         | `#c4c7cc`                         |
| hairline                       | `rgb(255 255 255 / .07)`          | `rgb(17 18 20 / .075)`            |
| unlit dot                      | `rgb(255 255 255 / .13)`          | `rgb(17 18 20 / .15)`             |
| ember / ember text             | `#ff6b2c` / `#ff9864`             | `#f2591a` / `#b83f0c`             |
| green / red                    | `#5fc27a` / `#f26b60`             | `#1f7a44` / `#c93a2f`             |

Type: Geist for words, Geist Mono (tabular) for every number, path, command and duration.
13px/20px body; 12–12.5px meta; panel titles 13px/600; the one headline in a panel up to 19px/600,
tracking −0.022em. Sentence case everywhere. Icons: Lucide only, 2px stroke, used sparingly (dots
carry state, so most rows need no icon).

Motion: one curve, `cubic-bezier(.2,.8,.2,1)`, 120–220ms for UI; the chase is 1.2s linear; a live
leading dot pulses at 1.1s. When a decision is made the whole view reacts together (halftone fades,
glyphs change, rails advance). Reduced motion: glyphs and rails hold still, fades only.

## Library

- Primitives: `StatusGlyph` (the dot glyph), `AgentSigil`, `DotRail`, `Halftone`, `Spinner` (the
  chasing ring), `Kbd` (keycap), `Button`, `IconButton`, `Popover`, `Tooltip`.
- Every component is rebuilt on these: no component draws its own progress bar, status icon,
  avatar, badge pill or border recipe.
- All behaviour stays: ui-sdk parts, agent-ready surfaces, keyboard maps, reduced motion, a11y.
- Both themes are first-class. Contrast: text ≥ 4.5:1, state marks and control edges ≥ 3:1.

## Site (apps/docs)

Same language, same tokens; the site is a showcase of the components, not a separate brand.

1. **Nav:** floating sheet (same edge recipe), logo left, links, ⌘K search (a keycap), theme
   toggle, one primary keycap "Get started". Sticky.
2. **Hero:** centred. H1 **"Components for agent interfaces."** (Geist 600, 64–72px, −0.035em).
   Sub: "Open-source React components for agent runs, plans, terminals, diffs and approvals. Copy
   them into your app, or let your coding agent install them." Two keycaps: "Browse components"
   (primary), "Get started". Install command in a well with copy.
3. **Hero stage:** the lab scene, built from the real library components and fully live:
   RunHeader across the top; Plan + Trace left; ApprovalPrompt (the focal point, with its halftone)
   - Terminal centre; Subagents + Context right. Approving or denying drives the whole stage. One
     ember halftone light sits behind the top of the stage (large dots fading out), at every width.
4. **Sections** (headline left, paragraph right, one visual; no eyebrow labels):
   "Every part of the run." (a bento of live components) · "Your agent can use it, too." (the live
   ui-sdk agent demo) · "Your agent can install it." (manifest, registry, MCP, CLI, llms.txt + a
   terminal) · "Built right." (four hairline columns) · closing call to action with the logo tile
   and one halftone.
5. **Logo:** an ember rounded tile with a white 5×5 dot "K".
6. **Components index, component pages, docs:** same nav, quiet and Linear-docs-like; previews sit
   on a canvas-coloured stage; code in wells. Keep all functionality (tabs, props tables, ⌘K, copy,
   mobile nav).
7. **Mobile:** composed, not shrunk. Stage becomes ApprovalPrompt, Plan, Terminal stacked; nothing
   overflows at 390px; no text under 11px.

## Rejected — never do these

- Copying a reference (Midday, LumaRoute, Raycast, Linear). They are examples of taste only.
- Blurry glows, LED bloom, chrome/metal, grain, paper textures, washes and tints on chrome.
- Solid progress bars, status pills and badges, letter avatars, spinner icons.
- Blue or purple accents, "AI" gradients, sparkles, mascots.
- Wide/expanded or serif display type; uppercase mono label soup.
- Pill buttons, pastel state fills, boxes inside boxes, dashboard clutter (toolbars, legends,
  eyebrow pills, stat chips).
- Marketing slogans ("watch your agents work"). It is a UI library; say what it is.
- Accumulating: each round should remove more than it adds.

## Quality bar

axe: zero serious/critical in both themes at 1440 and 390; visible focus everywhere; reduced motion
respected; no console errors; no horizontal overflow at 390px; one h1 per page; `pnpm check` green.
