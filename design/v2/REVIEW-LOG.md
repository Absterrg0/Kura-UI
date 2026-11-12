# v2 review log (Theo-style)

Reviewer: Fable 5.2 (high effort), single reviewer. Fixed 14-shot set (`design/v2/shots.mjs`),
scored on the 14-category rubric (`RUBRIC.md`) against `DIRECTION.md`. Target: ≥ 9.5.

| Round | Score  | Notes                                                                                                             |
| ----- | ------ | ----------------------------------------------------------------------------------------------------------------- |
| R1    | 7.3/10 | On-direction, clear step up; short of Raycast/Linear polish.                                                      |
| R2    | 7.9/10 | Direction held, nothing rejected crept back; hero composition, light at laptop widths, mobile and axe still open. |

## R1 findings (to fix in R2)

Must-fix

1. Previews cropped mid-control (bento, index cards, stage, mobile): fit examples to their cards
   (container-width props or scale-to-fit ≥ ~0.8), crop only at a deliberate bottom fade.
2. Ember light: fewer, crisper spans with a hot core and sharp leading edge; light starts below the
   install chip and never tints it; masked edges (no hard stop from scrollbar-gutter); a real
   light-mode treatment (no peach wash). Same for the CTA band (light under the headline; cut the
   ~220px glow gap before the footer).
3. Hero stage focal point: ApprovalPrompt column ~1.3× wider, raised, stronger shadow; Plan and
   Subagents secondary; no empty bottoms in Plan/Checkpoints.
4. "Your agent can install it": terminal top-aligned with the H2 and stretched to the list height;
   mobile: no mid-word wraps, no clipped first line (overflow-x-auto, no wrap).
5. Light-mode faint text ≥ 4.5:1 (trust strip, sidebar labels, "beta", mono footnotes).
6. Component page: render inline code (no literal backticks); install chip shows the full command.

Polish
7. ⌘K: title/slug matches first ("approve" → Approval Prompt), don't list nearly everything.
8. Index cards: hover state; one-line human summaries.
9. Bento dead space: size cards to content; Terminal card starts with output.
10. Sticky nav: more opaque + blur; top canvas fade in the gap above it.
11. Sidebar: drop "beta" noise (mark only experimental, quietly).
12. One grid: nav, stage, sections, footer, docs content share consistent left edges.
13. Logo: K-in-squircle reads generic — a more distinctive, simple, ownable ember mark.

Note: R2 was started on the sandbox and interrupted mid-way (it had begun on items 2 and the CTA
band); verify what is done before continuing.

## R2 findings (to fix in R3)

Scores: hierarchy 7.5 · type 8.5 · colour 8 · layout 7.5 · consistency 7.5 · brand 7.5 · clarity 8 ·
interaction 8.5 · light/dark 8.5 · craft 7 · a11y 7 · responsive 6.5 · motion 9 · copy 9 → **7.9**.

Must-fix

1. Hero terminal scrolls to a clipped sliver of the RUN badge: fit the output to maxHeight; drop
   `(N tests)` at 390.
2. Focal card is the smallest and its buttons are below the fold at 1440×900: Plan 6 rows, fleet 3
   agents, no `self-center`, one top edge and height; tighter hero top padding.
3. Ember light fails at laptop widths (stubs at 1440, gone at 1280): side spans only ≥ 1680px; make
   the top-edge bloom the signature at every width (full stage width, hotter core, wider hot line).
4. Mobile ember is muddy: below md, no spans, one unscaled glow under the mark / stage top.
5. Mobile bento shrunk to ~5px text: ScaleToFit floor ≈ 0.8 with a right-edge fade; `max-h` not `h`.
6. Index previews: centre panels that fit, top-anchor + fade only on overflow; stage h-52; fix
   Thinking Indicator crop; no deep shadow smears inside cards.
7. axe serious: terminal dim text contrast, ContextMeter label, danger button contrast, DiffView
   label/scrollable-region issues; heading order on /components.
8. Component page at 390: stacked props table; ApprovalPrompt footer must wrap.
9. Nav wraps at 768: nowrap links, menu sheet below lg.

Polish: RunHeader repeats Plan progress (drop progress/tokens) · bento row-3 voids · diff card clips
mid-word · Built right → hairline columns, no icon tiles · Beta pill only for experimental · no
light-mode side spans · nav chrome 0.97 · agent terminal tail · "Ask again" in hero · Spec chip
collides with tooltip · quieter syntax theme · ⌘K placeholder · linkify related/whenNotToUse slugs ·
one content width · hooks page code panes.
