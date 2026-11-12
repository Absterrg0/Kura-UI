# v2 review log (Theo-style)

Reviewer: Fable 5.2 (high effort), single reviewer. Fixed 14-shot set (`design/v2/shots.mjs`),
scored on the 14-category rubric (`RUBRIC.md`) against `DIRECTION.md`. Target: ≥ 9.5.

| Round | Score  | Notes                                                        |
| ----- | ------ | ------------------------------------------------------------ |
| R1    | 7.3/10 | On-direction, clear step up; short of Raycast/Linear polish. |

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
