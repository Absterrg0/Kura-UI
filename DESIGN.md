# Washi & Sumi — the Kura UI design language

> **Everything is still until the model speaks.**
> Surfaces are washi paper and sumi ink. One vermilion seal colour, _shu_, is the signal: it appears only where an
> agent is thinking, listening, streaming or asking for something.

Kura (蔵) is a storehouse — a calm, well-made place where valuable things are kept. The
components are instruments for working with models: precise, warm, legible, a little tactile,
never loud. Kura is a sibling of Kurambit and shares its craft: handmade paper stocks, sumi ink,
a vermilion seal, Redaction for the lines that speak and Geist for the work. This document is the
contract every component follows. It draws on people we admire (Emil Kowalski, Rauno Freiberg,
Paco Coursey, Jhey Tompkins, Vercel Geist, Linear, Raycast) and on the AI-interface wave (AI
Elements, ElevenLabs UI, prompt-kit, assistant-ui). We take principles, not looks.

---

## 1. Principles

1. **Quiet by default, alive on signal.** Paper surfaces, ink type, one accent. The accent (shu,
   vermilion seal ink) means _the machine is doing something_: streaming, listening, running a tool,
   awaiting approval. If nothing is happening, nothing glows.
2. **Responsive before decorative.** Every interaction acknowledges input within one frame
   (press scale, hover tint, focus ring). Decoration is optional; feedback is not.
3. **Motion explains, never performs.** Animate to show where something came from, what changed,
   or that work is in progress. Never animate to fill time.
4. **Interruptible everything.** A user can reverse any gesture or state mid-flight. Use springs
   (they keep velocity) or CSS transitions (they retarget) — never keyframes for state toggles.
5. **Text is the interface.** Model output is text. Typography, rhythm and contrast matter more
   than chrome.
6. **Agents read our components too.** Every component ships a manifest (`*.meta.ts`) so an agent
   can choose it, configure it and compose it without guessing. Clear names, explicit states,
   data attributes for every part (`data-slot`, `data-state`).

---

## 2. Color

All colors are OKLCH CSS variables defined in `packages/react/src/styles/kura.css` and exposed to
Tailwind as `*-kura-*` utilities. **Components never hard-code colors and never use `dark:`** —
tokens flip under `.dark` or `[data-theme="dark"]`.

### Materials — paper stocks and ink (hue ~85)

| Token                | Material                              | Light                   | Dark ("sumi")           |
| -------------------- | ------------------------------------- | ----------------------- | ----------------------- |
| `canvas`             | the washi page                        | `oklch(0.926 0.021 86)` | `oklch(0.175 0.008 80)` |
| `surface`            | a sheet laid on the page              | `oklch(0.971 0.013 87)` | `oklch(0.205 0.009 80)` |
| `surface-raised`     | bright print stock (popovers, prints) | `oklch(0.994 0.007 89)` | `oklch(0.235 0.01 80)`  |
| `surface-sunken`     | a pressed well (inputs, code)         | `oklch(0.9 0.024 85)`   | `oklch(0.152 0.007 80)` |
| `fg` / `ink`         | sumi ink                              | `oklch(0.197 0.008 85)` | `oklch(0.935 0.018 86)` |
| `fg-muted`           | pencil (≥ 4.5:1 on every stock)       | `oklch(0.47 0.018 83)`  | `oklch(0.76 0.018 85)`  |
| `gray-1` … `gray-12` | the full paper → ink scale            | see `kura.css`          | see `kura.css`          |

Borders are ink at 8 / 13 / 24% alpha, so they sit on any stock. Shadows are ink-tinted, never
pure black, and stay low.

### Semantic tokens (use these, not the scale)

| Utility                                                                                        | Meaning                                                   |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `bg-kura-canvas`                                                                               | page background                                           |
| `bg-kura-surface` / `-raised` / `-sunken`                                                      | cards, raised panels, wells and inputs                    |
| `bg-kura-overlay`                                                                              | translucent popovers/menus (pair with `backdrop-blur-xl`) |
| `bg-kura-hover` / `bg-kura-active`                                                             | translucent hover/pressed tints (work on any surface)     |
| `text-kura-fg` / `-fg-muted` / `-fg-subtle` / `-fg-inverted`                                   | text hierarchy                                            |
| `border-kura-border` / `-border-subtle` / `-border-strong`                                     | translucent hairlines                                     |
| `bg-kura-ink` / `-ink-hover`                                                                   | primary (ink) buttons                                     |
| `bg-kura-accent` / `-accent-hover` / `-accent-fg` / `-accent-subtle` / `text-kura-accent-text` | the signal                                                |
| `kura-danger*`, `kura-success*`, `kura-warning*`                                               | status only — never decoration                            |
| `kura-ring`                                                                                    | focus ring color                                          |

### The one accent — shu (vermilion seal ink, hue ~38)

`accent` light `oklch(0.585 0.178 37.5)` (deep enough for white text), dark `oklch(0.69 0.17 40)`;
`shu` is the brighter seal red for marks and shapes. Status colours keep their distance: danger is a
deep beni red (hue 20), success matcha, warning ochre. Rules:

- At most **one** accent-filled element per view (e.g. the "Run agent" button or the live orb).
- Use `accent-subtle` + `accent-text` for small live states (a running step, a listening pill).
- The primary call-to-action is **ink**, not accent. Accent is for AI-specific actions and states.
- No purple-to-pink "AI gradients", no sparkles as decoration (see Anti-patterns).
- Display serif (`font-kura-display`, Redaction in the docs) only for lines that speak: empty-state
  headlines, verdicts, big titles. Never for UI labels. Micro-labels are mono, uppercase, tracked.

---

## 3. Typography

- **Sans:** Geist (via `geist`/`next/font` or `@fontsource-variable/geist`), falling back to
  Inter, `ui-sans-serif`, `system-ui`. Token: `font-kura-sans`.
- **Mono:** Geist Mono → `ui-monospace`, SF Mono, JetBrains Mono, Menlo. Token: `font-kura-mono`.
  Use mono for code, token counts, IDs, timings, keyboard-like data.
- Kura reads `--font-geist-sans` / `--font-geist-mono` if your app defines them (next/font does).
- Scale (px): 11 · 12 · 13 · 14 (UI default) · 15 · 16 (reading) · 20 · 24 · 32 · 48.
- Use `tabular-nums` for anything that counts or ticks (timers, tokens, costs).
- Body copy line-height 1.6; UI labels 1.25–1.4; display tight (`tracking-tight`, 1.05–1.15).
- Headings use weight 500–600, never 700+ in UI. Contrast comes from size and color, not weight.
- Streaming text never reflows previous lines; reserve height or append only.

---

## 4. Shape: radii, borders, shadows

**Radii:** `rounded-kura-xs` 4 · `sm` 6 · `md` 8 · `lg` 12 · `xl` 16 · `2xl` 20 · full for pills.
Nested corners are concentric: `inner = outer − padding` (a 16px card with 4px padding holds
12px children).

**Hairline borders.** Borders are translucent (`oklch(ink / 0.07–0.2)`) so they work on any
surface. We prefer **shadow-rings** (`0 0 0 1px var(--kura-border)`) over `border` so elements do
not shift by a pixel when the border appears, and so rings composite with elevation.

**Layered shadows** — a ring plus tight, low-opacity ambient layers:

| Token               | Use                              |
| ------------------- | -------------------------------- |
| `shadow-kura-xs`    | buttons, keycaps, chips          |
| `shadow-kura-sm`    | cards, inputs, composers at rest |
| `shadow-kura-md`    | raised cards, tooltips, toasts   |
| `shadow-kura-lg`    | popovers, menus, dialogs         |
| `shadow-kura-focus` | the focus ring (see §7)          |

In dark mode shadows carry less meaning; elevation comes from a lighter surface plus a 1px inner
top highlight (`inset 0 1px 0 oklch(1 0 0 / 0.04)`), built into the dark tokens.

---

## 5. Motion

### Durations (CSS `--kura-duration-*`, JS `durations.*` in seconds)

| Token     | ms  | Use                                      |
| --------- | --- | ---------------------------------------- |
| `instant` | 90  | exits, hover tints, key presses          |
| `fast`    | 150 | tooltips, small popovers, press feedback |
| `base`    | 220 | dropdowns, toggles, list insertions      |
| `slow`    | 320 | panels, larger reveals                   |
| `slower`  | 480 | page-level, hero, drawers                |

UI motion stays under 300ms. Anything triggered dozens of times a day (menus, command palette)
should be _fast_ or not animate at all.

### Easing (CSS `ease-kura-*`, JS `easings.*`)

- **`out` — `cubic-bezier(0.23, 1, 0.32, 1)`**: the default. Enters and anything the user
  triggers. Fast start = feels responsive.
- **`in-out` — `cubic-bezier(0.77, 0, 0.175, 1)`**: on-screen movement from A to B.
- **`in` — `cubic-bezier(0.55, 0, 1, 0.45)`**: exits only, and short.
- **`spring` — a CSS `linear()` spring** with ~0.6% overshoot for CSS-only "settle".
- Never `linear` except for continuous loops (spinners, shimmer, marquee). Never `ease-in` on enter.

### Springs (motion/react — `import { springs } from "@kura-ui/react/utils"`)

| Preset   | Config                                                 | Use                                              |
| -------- | ------------------------------------------------------ | ------------------------------------------------ |
| `snappy` | `{ type: "spring", visualDuration: 0.2, bounce: 0.1 }` | presses, toggles, small flips                    |
| `smooth` | `{ visualDuration: 0.35, bounce: 0 }`                  | layout, panels, popovers (default)               |
| `gentle` | `{ visualDuration: 0.5, bounce: 0.05 }`                | sheets, drawers, hero                            |
| `bouncy` | `{ visualDuration: 0.4, bounce: 0.25 }`                | delight moments, orbs, success ticks — sparingly |

### Rules

- **Origin-aware.** Popovers and tooltips scale from their trigger
  (`origin-(--radix-popover-content-transform-origin)`), from `0.96`, never from `0`.
- **Enter slower than exit.** Exits are ~60% of the enter duration.
- **Interruptible.** Use transitions/springs for state; keyframes only for one-shot enters and loops.
- **Skip repeat animations.** Moving between tooltips is instant (`data-[state=instant-open]:animate-none`).
- **Press feedback:** `active:scale-[0.97]` on buttons; keys travel 1px.
- **Blur for state swaps.** When swapping text/icons in place, cross-fade with 2px blur rather
  than sliding.
- **Animate `transform`, `opacity`, `filter`, `clip-path`.** Never width/height/top/left for
  continuous motion. Use `layout` animations from motion for size changes.
- **Stagger** list reveals 30–50ms per item, capped at ~8 items.
- **Streaming:** append tokens without animating each one; animate the _caret_ and the end-of-stream
  settle instead.

### Reduced motion (`prefers-reduced-motion: reduce`)

Not "no motion" — _no travel_. Keep opacity fades (they carry meaning), remove translation,
scale, blur, parallax, and continuous loops.

- CSS tokens do it automatically: `--kura-pop-scale: 1`, `--kura-pop-y: 0`, `--kura-rise-*: 0`.
- Tailwind: `motion-reduce:animate-none`, `motion-reduce:scale-100`, etc.
- JS: `useReducedMotion()` from `@kura-ui/react/hooks`; pass `reducedTransition` or a fade.
- Shaders render one still frame; audio visualisers show a static level meter.
- Every component test covers reduced motion.

---

## 6. Density & layout

- Base unit 4px. Control heights: 24 (xs) · 28 (sm) · 32 (md, default) · 40 (lg).
- Hit targets ≥ 24×24 on desktop; ≥ 44×44 on touch (`pointer-coarse:` variants).
- Default UI font 14px, 13px in dense toolbars, 15–16px for conversation text.
- Content measure for model output: 60–75ch.
- Use `gap`, not margins, inside components. Components never set outer margins.

---

## 7. Focus & states

- Focus ring: `focus-visible:shadow-kura-focus` = 1px canvas gap + 2px vermilion ring at 60%.
  Only on `:focus-visible`, never on mouse click. Never `outline-none` without a replacement.
- States are exposed as data attributes for styling and for agents: `data-state="open|closed"`,
  `data-active`, `data-pressed`, `data-status="idle|running|done|error"`.
- Disabled = 50% opacity + `cursor-not-allowed` + the native `disabled` attribute.
- Loading keeps the element's size (no layout shift) and sets `aria-busy`.

---

## 8. Sound & haptics

- **Off by default.** Sound is opt-in per app (`sound` prop or context), never per component.
- When enabled: very short (< 120ms), soft, low-volume cues only for *events the user did not
  directly cause*: an agent finished, approval needed, recording started/stopped.
- Haptics (`navigator.vibrate(8)`) only on touch devices, only for confirmations and
  start/stop of recording. Never on hover, never repeated.
- Respect `prefers-reduced-motion` as a proxy for "reduce sensory load" — no sounds/haptics then.

---

## 9. Accessibility baseline

- WCAG 2.2 AA contrast for text (`fg-muted` ≥ 4.5:1 on canvas in both themes).
- Every interactive element is keyboard reachable, has a visible focus ring and an accessible
  name. Icon-only buttons require `label`.
- Live AI output: use `role="status"`/`aria-live="polite"` for progress; `role="log"` for
  conversation; never announce every streamed token — announce the completed message.
- Decorative visuals (`ShaderCanvas`, orbs, gradients) are `aria-hidden`.
- Audio/voice components expose a text equivalent of their state ("Listening", "Muted").

---

## 10. Anti-patterns (we do not ship these)

- Purple→pink "AI" gradients, sparkle ✨ icons as decoration, glowing everything.
- Animating on every keystroke or token; bouncing UI that the user triggers 100× a day.
- `ease-in` enters, `linear` UI transitions, durations over 400ms for UI state.
- Scale from 0, transform-origin center on anchored popovers.
- Hard-coded hex colors, `dark:` overrides in components, opaque borders that double up.
- Spinners for model "thinking" (use shimmer-text / thinking-indicator — it's thought, not network).
- Layout shift when content streams in or a button enters a loading state.
- Tooltips with essential info or interactive content; icon buttons without labels.
- Fake progress bars, fake typing delays, dark patterns around approval/consent.
- Components that set outer margins, fixed widths, or global styles.
