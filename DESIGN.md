# The dot language — the Kura UI design language

> **Agents emit tokens. So in Kura, everything measured or stateful is drawn in dots.**
> That one motif is the identity. The rest is a quiet, crisp frame for it.

Kura (蔵) is a storehouse: a calm, well-made place where valuable things are kept. The components
are instruments for supervising agents. This document is the contract every component follows.
The source of truth for values is `packages/react/src/styles/kura.css`.

---

## 1. The seven rules

1. **Status is a 5×5 dot glyph**, never an icon or a coloured pill (`StatusGlyph`).
   queued = hollow ring · running = a light chasing round the ring · waiting on a person = ember
   ring with a blinking centre · done = solid disc · failed = a cross · skipped = a dash ·
   paused = two bars.
2. **Every agent has a face**: a symmetric 5×5 dot sigil generated from its name, in a small
   raised tile (`AgentSigil`). Same name, same face. No letter avatars, no robot icons.
3. **Anything measured is a row of dots** (`DotRail`): run progress, subagent progress, trace
   spans (a run of lit dots on a shared time axis), meters, waveforms (a dot matrix). Context is
   one hundred dots, one per percent. Property lists and tree guides use dotted leaders
   (`kura-leader`). No solid progress bars.
4. **Ember means "this needs you" and nothing else.** It appears as a halftone (`Halftone`: dots
   that shrink as they fade) in the top-right corner of the thing that needs a person, on its
   glyph and on its label. When the person decides, ember leaves the screen. Never ember for
   decoration, hover, links, warnings or brand chrome inside components.
5. **One way to draw an edge.** A _sheet_ is a flat fill with one crisp 1px ring, a faint 1px
   halo outside it and an etched top edge; radius 14px. A _well_ (code, commands, terminals,
   inputs) is sunk: darker fill, inner shadow, radius 10px. Nothing else has a border. No glows,
   no blur, no grain, no gradients on surfaces, no boxes inside boxes beyond sheet → well.
6. **Buttons are keycaps**: raised, radius 9px, 32px tall, with the shortcut printed on the key
   in a small keycap (`Kbd`). Primary is the ink fill (light on dark, dark on light). No pill
   buttons, no accent-colour buttons.
7. **Monochrome ink.** Text is ink in three steps. Green and red appear only for test results,
   diffs and failures; ember only per rule 4. There is no blue. Code is monochrome too.

---

## 2. Colour

All colours are CSS variables exposed to Tailwind as `*-kura-*` utilities. **Components never
hard-code colours and never use `dark:`**; tokens flip under `.dark` or `[data-theme="dark"]`.

| Token (utility)                              | Dark                              | Light                             | Use                               |
| -------------------------------------------- | --------------------------------- | --------------------------------- | --------------------------------- |
| `canvas` (`bg-kura-canvas`)                  | `#0c0d0f`                         | `#e9ebee`                         | the page                          |
| `surface` (`bg-kura-surface`)                | `#141518`                         | `#ffffff`                         | sheets                            |
| `surface-sunken` (`bg-kura-surface-sunken`)  | `#0a0b0d`                         | `#f2f3f5`                         | wells                             |
| `raised` (`bg-kura-raised`)                  | `#1e2024`                         | `#ffffff`                         | keys, tiles, popovers             |
| `fg` / `fg-muted` / `fg-subtle`              | `#f2f3f4` / `#a4a7ad` / `#878b92` | `#111214` / `#53565c` / `#62666d` | ink, ink-2, ink-3 (all text-safe) |
| `faint` (`text-kura-faint`)                  | `#3a3d43`                         | `#c4c7cc`                         | decoration only: leaders, spines  |
| `dot-off` (`bg-kura-dot-off`)                | `rgb(255 255 255 / .13)`          | `rgb(17 18 20 / .15)`             | unlit dots                        |
| `border` / `border-subtle` / `border-strong` | white at 6–14%                    | ink at 6.5–16%                    | hairlines inside a sheet          |
| `ember` / `ember-text`                       | `#ff6b2c` / `#ff9864`             | `#f2591a` / `#b83f0c`             | needs a person (rule 4)           |
| `success` / `success-text`                   | `#5fc27a`                         | `#2c9a58` / `#1f7a44`             | passes, additions                 |
| `danger` / `danger-text`                     | `#f26b60`                         | `#c93a2f`                         | failures, deletions, destructive  |
| `ink-fill` (`bg-kura-ink-fill`)              | near-white, 2-stop                | near-black, 2-stop                | the primary key                   |
| `ring` (`outline-kura-ring`)                 | ink-2 at 70%                      | ink at 50%                        | focus                             |

There is **no accent colour**. The old `accent` tokens resolve to ink so existing markup stays
monochrome; do not use them in new code. `warning` resolves to ember, so do not use it for
anything that is not "a person is needed".

Contrast: text ≥ 4.5:1 on its surface in both themes; state marks and control edges ≥ 3:1.
`faint` and `dot-off` are below 3:1 on purpose and must never carry text or the only signal.

---

## 3. Elevation and shape

| Recipe (utility)      | What it is                                               |
| --------------------- | -------------------------------------------------------- |
| `shadow-kura-surface` | a sheet: ring + halo + etched top edge + one soft drop   |
| `shadow-kura-sunk`    | a well: inner shadow + inner hairline                    |
| `shadow-kura-raised`  | a key or tile: top highlight + ring + 1px drop           |
| `shadow-kura-ink`     | the primary key's edge                                   |
| `shadow-kura-key`     | a small printed keycap (`Kbd`, citations)                |
| `shadow-kura-popover` | floating things: popovers, palettes, menus, dragged rows |

Radii: sheet 14 (`rounded-kura-xl`), well 10 (`rounded-kura-lg`), key 9, small key 7, keycap 5,
hover rows 9. Nothing is a pill; the only circles are dots.

Layout inside a sheet: an 11-unit header (44px, title 13px/600, no rule under it), rows of 32–36px
with a 9px-radius hover fill inset 6px from the sheet's edge, wells inset 6px. Lists have no
dividers. A hairline is allowed only to separate a footer of actions from content.

---

## 4. Dots

| Utility / component | Use                                                                          |
| ------------------- | ---------------------------------------------------------------------------- |
| `kura-dots`         | the one background that draws dots; tune `--kura-dots-color`, `-r`, `-pitch` |
| `kura-leader`       | a faint line of fine dots, 5px thick: leaders, tree guides, spines, rules    |
| `DotRail`           | progress or a span: lit dots from `start` for `value`, optional live head    |
| `StatusGlyph`       | the seven states                                                             |
| `AgentSigil`        | a face from a name                                                           |
| `Halftone`          | the ember corner; the parent must be `relative isolate`                      |
| `Spinner`           | the chasing ring, for loading that is not an agent state                     |

Dots sit on a 3-unit grid inside a 15-unit glyph (r 1.1); rails use a 6px pitch (r 1.1); leaders
a 5px pitch (r 0.8). Rails snap to whole dots: a dot is never cut in half.

---

## 5. Type

- **Geist** for words, **Geist Mono** (tabular) for every number, path, command and duration.
- 13px/20px body; 12–12.5px meta; panel titles 13px/600; the one headline in a panel up to
  19px/600 at −0.022em. Conversation text 15px.
- Sentence case everywhere. No uppercase labels, no letter-spaced mono eyebrows.
- Icons: Lucide only, 1.75–2px stroke, used sparingly. Dots carry state, so most rows need no icon.

---

## 6. Motion

- **One curve** for UI: `ease-kura-snap` = `cubic-bezier(.2, .8, .2, 1)`, 120–220ms
  (`--kura-duration-fast` 140ms, `-base` 200ms). Enters may use `ease-kura-out`.
- **Three loops**, all dots: the chase (`animate-kura-chase`, 1.2s linear, 12 dots 100ms apart),
  the blink of a waiting glyph's centre (`animate-kura-blink`, 1.1s), the pulse of a live leading
  dot (`animate-kura-dot-pulse`, 1.1s).
- When a decision is made the whole view reacts together: the halftone fades, glyphs change,
  rails advance.
- Keys travel 1px on press (`active:translate-y-px`). Nothing scales from 0; nothing blurs.
- Streaming: append tokens without animating each one; one pulsing dot marks the live edge.
- Springs (`springs.*` from `lib/motion`) are for layout changes only (reorder, expand).

### Reduced motion

Glyphs and rails hold still; only opacity fades remain. `motion-reduce:animate-none` on every
loop, `motion-reduce:transition-none` on every travel, `useReducedMotion()` in JS. The running
glyph rests with a quarter of its ring lit. Shaders render one still frame. Every component test
covers it.

---

## 7. Focus, states, density

- Focus: `focus-visible:outline-2 outline-kura-ring` with a 2px offset (inset on rows). Only on
  `:focus-visible`. Never remove an outline without a replacement.
- States are data attributes, for styling and for agents: `data-state`, `data-status`,
  `data-decision`, `data-selected`.
- Disabled = 50% opacity + `cursor-not-allowed`. Loading keeps the element's size and sets
  `aria-busy`.
- Base unit 4px. Control heights 24 · 28 · 32 (default) · 40. Hit targets ≥ 24px on desktop,
  ≥ 44px on touch. Printed shortcuts hide on touch (`pointer-coarse:hidden`).
- Components use `gap`, never outer margins, and never a fixed width on the root.

---

## 8. Accessibility baseline

- WCAG 2.2 AA. A glyph is never the only signal: every state is also a word, spoken or shown.
- Every control is keyboard reachable with an accessible name; icon-only buttons require `label`.
- Live output: `role="status"` for progress, `role="log"` for conversation. Never announce every
  streamed token.
- Decorative dots (halftones, sigils without a label, rails without a label) are `aria-hidden`;
  a `DotRail` with a `label` is a `progressbar`.
- Agent-ready: every control is a ui-sdk part, every agent-facing root is an `agentSurface`, and
  anything a person must decide carries `data-agent-confirm`.

---

## 9. Never

- Copying a reference (Midday, Raycast, Linear). They are examples of taste only.
- Blurry glows, LED bloom, chrome or metal, grain, paper textures, washes and tints on chrome.
- Solid progress bars, status pills and badges, letter avatars, spinner icons, shimmer on labels
  that already have a glyph.
- Blue or purple accents, "AI" gradients, sparkles, mascots, coloured syntax highlighting.
- Wide or serif display type; uppercase mono label soup.
- Pill buttons, pastel state fills, boxes inside boxes, dashboard clutter (toolbars, legends,
  eyebrow pills, stat chips).
- Ember for anything but "a person is needed".
- Hard-coded colours, `dark:` overrides, outer margins, fixed root widths, layout shift.
- Fake progress, fake typing delays, dark patterns around approval or consent.
- Accumulating: a change should remove more than it adds.
