# v3 review log — the dot language (council method)

Two review-only reviewers per round: **Fable 5.2 (high effort)** and **Opus 5.5 (extra-high
effort)**. Fixed 14-shot set (`design/v3/shots.mjs`), scored on the 14-category rubric
(`RUBRIC.md`) against `DIRECTION.md`. A round passes when **both** score ≥ 9.5 with no Must-fix.

History before v3: the v2 direction ("Raycast-grade dark") reached 7.3 (R1) and 7.9 (R2) with one
reviewer (`design/v2/REVIEW-LOG.md`). The owner then rejected the look itself; v3 replaces it.

| Round | Fable 5.2 | Opus 5.5 | Notes                                                                                                                                                                                                         |
| ----- | --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1    | 8.0       | 7.8      | First full build on the dot language (commit 519f6c7). Identity lands (brand 9.0 from both); focus rings, mobile docs and loose edges hold it back.                                                           |
| R2    | 8.8*      | 8.5      | Commit 87f0d7b. Round-1 list largely closed. *Live checks were cut short: the docs dev server hit its 2-hour limit mid-review, so focus, 390px pages and motion are provisional.                              |
| R3    | 9.1       | 8.9      | Commit e505f88. Fully verified live (48 pages, 192 axe runs, Tab walks, approve/deny at three widths). A decision now moves 0px; four to five small must-fixes remain.                                        |
| R4    | 9.2       | 9.2      | Commit d5d3374. Fully verified live. All round-3 must-fixes closed except the hero clocks (live values still a second apart). New: approval shortcuts leak from other widgets; terminals break words.         |
| R5    | 9.3       | 9.4      | Commit a6b1fec. Fully verified live. Every round-4 must-fix closed, no regressions. Left: focus lost when a pressed control unmounts, approval keys acting while the prompt is off screen, small phone seams. |

---

## Round 1 — commit 519f6c7

Shots: fixed 14-shot set. Both reviewers also sampled all 34 public component pages in both
themes, 390px layouts, approve/deny, ⌘K, reduced motion and axe.

| #   | Category                 | Fable 5.2 | Opus 5.5 |
| --- | ------------------------ | --------- | -------- |
| 1   | Visual hierarchy         | 8.4       | 8.2      |
| 2   | Typography               | 8.5       | 8.6      |
| 3   | Colour & state semantics | 8.2       | 8.1      |
| 4   | Layout & spacing         | 7.8       | 7.9      |
| 5   | Consistency              | 7.8       | 7.6      |
| 6   | Brand distinctiveness    | 9.0       | 9.0      |
| 7   | Clarity & density        | 8.2       | 8.3      |
| 8   | Interaction states       | 7.0       | 7.8      |
| 9   | Light/dark parity        | 8.6       | 9.1      |
| 10  | Craft & polish           | 7.6       | 7.7      |
| 11  | Accessibility            | 6.5       | 6.0      |
| 12  | Responsive               | 7.8       | 7.1      |
| 13  | Motion                   | 8.5       | 8.7      |
| 14  | Copy                     | 8.3       | 8.4      |
|     | **OVERALL**              | **8.0**   | **7.8**  |

### Must-fix (merged, ranked)

1. **No visible focus ring on any Button and most controls** (both). `outline-none` sets
   `--tw-outline-style: none`, so `focus-visible:outline-2` draws nothing. 23 sites.
2. **Hero stage breaks at 1024** (Fable): the focal prompt gets ~290px between two fixed columns.
3. **Axe serious** (both): ink-3 on selected rows 4.31:1 (AgentFleet, Trace); Composer shortcut
   hint 3.4/2.7:1; Trace row name mismatch; BrowserSession log not focusable at 390.
4. **Component pages at 390** (Opus): props table falls off the edge; copy button covers code;
   DiffView legend breaks; index cards cut live controls; two pages pan sideways (Fable).
5. **Ember as a border** on a paused BrowserSession; **light halftone reads as a wash** (Fable).
6. **Context meter page contradicts rule 3**: a ring and a 20-dot rail, no hundred dots (Opus).
7. **Home repeats itself**: the bento repeats Plan, Trace and Terminal from the stage; a "Works
   with" strip the direction does not list; stretched empty wells (Opus).
8. **Ember overuse on the stage** (~9 marks): Plan header rail, fleet summary (Opus).
9. **"Denied" drawn as a failure** (red cross) in ApprovalPrompt; elsewhere it is a dash (Opus).
10. **The agent demo asks twice at once**, and "wants to: Deploys" is ungrammatical (both).
11. **"Beta" pill on every component page** (both). **Primitives have no pages** (StatusGlyph 404)
    while the intro imports StatusGlyph (both).
12. **AgentTimeline glyph misaligned** on steps with children (Opus). **Hero Trace** worse than
    the reference: dead indent, short rail, no durations, "now" line collisions (Fable).
13. **DiffView right insets** 6–8px vs 12–16px left; **Terminal header** jammed right (both).
14. Example defects: content-width tool-call rows in the fleet composition, an empty placeholder
    sheet in PromptQueue, a circular play button, 390px clips in AgentFleet and ContextMeter.
15. Story errors: terminal says done at "batch 3 of 10"; "Told no" vs "Denied by you".

### Polish (merged)

One duration format; one easing curve; ThinkingIndicator orbit/wave are bars and a spinner;
PromptSuggestions and Attachment examples are generic; layout jump on approve; green bullets and
`⎿` in the install transcript; hover spec tags straddle the ring; ⌘K cube icons and sticky query;
Title Case names vs sentence case; BrowserSession mock text 5–9px; ContextMeter danger in red;
VoiceDictation bare mic and "Status: Idle"; `bouncy` spring in the docs; slogan-like closing
headline; RunHeader state chip reads as a badge in light; ApprovalPrompt footer inset; ModelPicker
capability icons; ToolCall tool icon; boxes inside boxes in three examples; weak first examples.

### Verified good (do not touch)

Hero at 1440 in both themes; the decision choreography; reduced motion (91 animations → 0); the
dot primitives, AgentOrb and AudioWaveform; TaskList, Checkpoints, RunHeader, Terminal,
FileChanges, Composer; nav, ⌘K layout, mobile nav, footer, sidebar marker, monochrome code; the
390px home.

---

## Round 2 — commit 87f0d7b

The docs dev server stopped mid-review (it reached its 2-hour background limit at 04:27), so
neither reviewer finished the live Tab walk, the 390px component pages, reduced motion or the
agent demo after it plays. Scores for interaction, accessibility, responsive and motion are
provisional. Both reviewers saw all 14 shots, home at six widths in both themes, approve/deny,
the full index and 15–20 component pages in both themes with axe.

| #   | Category                 | Fable 5.2 | Opus 5.5 |
| --- | ------------------------ | --------- | -------- |
| 1   | Visual hierarchy         | 8.9       | 8.9      |
| 2   | Typography               | 8.9       | 8.8      |
| 3   | Colour & state semantics | 9.0       | 8.8      |
| 4   | Layout & spacing         | 8.6       | 8.4      |
| 5   | Consistency              | 8.7       | 8.4      |
| 6   | Brand distinctiveness    | 9.3       | 9.2      |
| 7   | Clarity & density        | 8.9       | 8.7      |
| 8   | Interaction states       | 8.5*      | 8.5      |
| 9   | Light/dark parity        | 9.2       | 9.0      |
| 10  | Craft & polish           | 8.4       | 8.2      |
| 11  | Accessibility            | 8.3*      | 7.8      |
| 12  | Responsive               | 8.6*      | 8.6      |
| 13  | Motion                   | 8.8*      | 8.9      |
| 14  | Copy                     | 8.9       | 8.8      |
|     | **OVERALL**              | **8.8***  | **8.5**  |

### Round-1 verification

Fixed: hero at 1024; ember overuse; "denied" as a dash; home repetition and the "Works with"
strip; beta pill; timeline glyph; terminal header; story errors; light halftone wash; library
focus rings (source + guard test). Partly: hero Trace (still no durations, kind icons, short
rail); DiffView insets (16 vs 11px). Regressed: the BrowserSession halftone now runs under text;
removing ScaleToFit means index cards cut sheets mid-row; the stage reflows on a decision.

### Must-fix (merged, ranked)

1. **Invisible focus on the site** (Opus): the header search trigger and the Related chips use
   `outline-hidden` with no focus style. Extend the guard test to `apps/docs`.
2. **Two serious axe failures** (both): CodeBlock line numbers 2.7–3.5:1 (`opacity-70`);
   Citation domain key name does not start with its visible text.
3. **Components index cuts sheets mid-row** (both): never crop a sheet's ring; primitives sit
   left-anchored; the Status glyph card cuts a row; the Context meter card shows a 10-dot rail.
4. **A decision reflows the hero** (both): Plan loses its detail line (−20px), the migrator rail
   goes (−15px).
5. **Hero Trace below the reference** (both): no durations, Lucide kind icons, a ~22-dot rail.
6. **Paused BrowserSession halftone under text** (both).
7. Nav link wraps at 768; props table breaks names mid-word; browser mock is 3–6px on phones.

### Polish (merged)

Agent demo left column ends ~300px short; empty 288px stages; stale bento paragraph; ⌘↵ in prose
vs Ctrl ↵ on keys; ThinkingIndicator is a generic typing indicator; two Lucide status icons left
(message error, spinner example); light wells on the canvas read as raised; two input recipes on
/components; ringed hook chips; ContextPanel "Files" vs "Free" too close and no % on Free; red
"M" in a terminal example; halftone loses its fade under reduced motion; DiffView and
ApprovalPrompt each appear twice on home; JS durations do not mirror CSS; install transcript cut
at 390; capability icon map left in ModelPicker; a console 404 on two component pages.

### Verified good (do not touch)

Hero at 1440 and its 768–1279 recut; approve/deny choreography; ember discipline; ApprovalPrompt
page and resolved states; dot primitives, AgentOrb, AudioWaveform; AgentFleet, Checkpoints,
TaskList, Terminal, FileChanges, Composer; nav (≥1024), footer, closing call to action, "Built
right", the install table; ⌘K layout with a resetting query; 390px home; sentence-case titles.

---

## Round 3 — commit e505f88

The server ran for the whole review window, so nothing is provisional. Fable: Tab walk on 10
pages in both themes, axe on 48 pages × 4 configurations, hero at three widths, the agent demo
played through, ⌘K, 390px full pages of every component. Opus: Tab walk on all 47 pages, the same
axe matrix, measured heights through approve and deny, layout shift, 36 component pages.

| #   | Category                 | Fable 5.2 | Opus 5.5 |
| --- | ------------------------ | --------- | -------- |
| 1   | Visual hierarchy         | 9.2       | 9.1      |
| 2   | Typography               | 9.1       | 9.0      |
| 3   | Colour & state semantics | 9.2       | 9.3      |
| 4   | Layout & spacing         | 9.0       | 8.8      |
| 5   | Consistency              | 9.0       | 8.8      |
| 6   | Brand distinctiveness    | 9.5       | 9.4      |
| 7   | Clarity & density        | 9.0       | 9.0      |
| 8   | Interaction states       | 9.0       | 8.9      |
| 9   | Light/dark parity        | 9.3       | 9.3      |
| 10  | Craft & polish           | 8.8       | 8.7      |
| 11  | Accessibility            | 8.7       | 8.6      |
| 12  | Responsive               | 8.9       | 8.9      |
| 13  | Motion                   | 9.3       | 9.2      |
| 14  | Copy                     | 9.1       | 8.9      |
|     | **OVERALL**              | **9.1**   | **8.9**  |

### Round-2 verification

All seven round-2 must-fixes verified fixed (site focus, the two axe failures, whole index
cards, no reflow on a decision — measured 0px at 1440, 1024 and 390 —, the BrowserSession
halftone, nav/props/browser mock), except the hero Trace, which is "partly": durations and dot
kinds landed, but the rail now touches them. No regressions.

### Must-fix (merged, ranked)

1. **Every docs code well has a second, invisible tab stop** (both): Shiki puts `tabindex="0"`
   on its `<pre>`; the wrapper hides that outline. **⌘K drops focus to `<body>` on close**
   (Fable).
2. **Pressed toggles lose their focus ring** in two copy-paste examples (Opus).
3. **One serious axe failure at 390** (both): a hand-rolled scrolling `<pre>` in a TaskList
   example.
4. **Hero Trace** (both): the rail and the now-line run into the durations; names shrink to ~6
   characters when narrow; its numbers contradict the Plan, Terminal and Subagents.
5. **A native blue × in the Components filter** in light (Fable).
6. **ApprovalPrompt halftone runs under text at 390** (Fable).

### Polish (merged)

Terminals hard-clip at 390 (hero, install transcript); the agent demo shifts on phones while it
plays; the filter is silently scoped to the active tab; ⌘ in prose where keys print Ctrl; 10.5px
keycap text; ModelPicker empty state; two titles promise icons that are gone; green Lucide checks
in a Spinner example; ToolCall examples still pass kind icons; ragged hero column bottoms; the
category row is cut at 390; diff lines end flush on the sheet edge; ThinkingIndicator is still a
generic typing indicator; ⌘K says "Getting started" where the sidebar says "Introduction"; copy
has no failure path; the hero re-asks after 12s.

### Verified good (do not touch)

Hero at every width and its decision choreography (zero movement, ember leaves, 0 animations
under reduced motion); ember discipline; the components index; the component page template at
390; desktop TraceWaterfall; AgentFleet, TaskList, FileChanges, DiffView review flow, Checkpoints,
PromptQueue, ContextPanel, StatusGlyph, DotRail, Halftone, AgentOrb, AudioWaveform; Composer's
ring; ModelPicker; ⌘K layout and ranking; mobile nav; nav, footer, "Built right", the install
table, the closing call to action; light wells; no horizontal overflow and one h1 on all pages.

---

## Round 4 — commit d5d3374

Both reviewers ran everything live: Tab walks (12 and 7+ pages, both themes), axe on 48 pages × 4
configurations (0 serious/critical after re-running two transient streaming-text hits), approve
and deny at 1440, 1024 and 390, reduced motion, ⌘K, 390px full pages.

| #   | Category                 | Fable 5.2 | Opus 5.5 |
| --- | ------------------------ | --------- | -------- |
| 1   | Visual hierarchy         | 9.4       | 9.3      |
| 2   | Typography               | 9.3       | 9.2      |
| 3   | Colour & state semantics | 9.5       | 9.3      |
| 4   | Layout & spacing         | 9.1       | 9.1      |
| 5   | Consistency              | 9.3       | 9.1      |
| 6   | Brand distinctiveness    | 9.6       | 9.5      |
| 7   | Clarity & density        | 9.3       | 9.2      |
| 8   | Interaction states       | 8.8       | 9.3      |
| 9   | Light/dark parity        | 9.5       | 9.4      |
| 10  | Craft & polish           | 9.1       | 8.9      |
| 11  | Accessibility            | 9.1       | 9.3      |
| 12  | Responsive               | 9.2       | 9.0      |
| 13  | Motion                   | 9.4       | 9.3      |
| 14  | Copy                     | 9.1       | 9.2      |
|     | **OVERALL**              | **9.2**   | **9.2**  |

### Round-3 verification

Fixed: the second tab stop in code wells; ⌘K focus return; pressed toggles; the TaskList axe
failure; the native blue ×; the halftone under text at 390; the stacked narrow Trace (no
collision, readable names). Partly: the hero's numbers — finished durations agree, live ones are
a second apart about 75% of the time. No regressions except terminals, which now wrap but break
words mid-word.

### Must-fix (merged, ranked)

1. **Approval keys fire from other widgets** (Fable): Ctrl+Enter in the bento Composer also
   approves the hero's migration; Esc closing the mobile nav denies it.
2. **ApprovalPrompt drops focus to `<body>` after a keyboard decision** (Fable): the actions row
   goes inert while it holds focus.
3. **Hero clocks disagree** (both): the Trace rounds where clocks floor; the Terminal's clock
   never resets for the second command; "5.1s" plays in about 3.1s.
4. **Terminals split words mid-word** (both): `break-all`, visible on the home page at 1440.
5. **Three manifest sentences contradict the direction** (Fable): "blue default", "AI signal
   colour", "use a progress bar".
6. **Needs-you labels truncate at 390** (both): "Paused fo…", "Nee…".

### Polish (merged)

Hero at 768–1279 has a 39px gap and a short right column; at 1440 the stretched Context sheet is
~40% empty; a live duration is shown three ways (clock, duration, decimal seconds); Trace shows no
glyph for skipped or paused spans; install transcript at 390 starts scrolled; the agent demo
terminal clips and grows a few px on phones; ArtifactCard preview cuts a line through its
letters; a dead Stop key in the hero; three sub-11px labels; Spinner pulses under reduced motion
while the glyph holds still; two ⌘ glyphs left in manifests; an unlabelled row in a
ThinkingIndicator example; an off-centre VoiceDictation example; a demo diff line 19px too long.

### Verified good (do not touch)

Hero decision choreography (0px at three widths), ember discipline, the stacked narrow Trace,
focus rings on every stop, ⌘K, the components filter and its empty state, mobile nav, DiffView
review flow, the whole component set in both themes, home sections at 1440 and 390, axe clean on
all 48 pages, one h1 and no horizontal overflow everywhere.

## Round 5 — commit a6b1fec

Both reviewers ran everything live: Tab walks (20 and 7 pages, both themes), axe on 48 pages × 4
configurations (0 serious/critical), approve and deny at five widths, reduced motion, ⌘K, 390px
full pages, clocks sampled every 60ms.

| #   | Category                 | Fable 5.2 | Opus 5.5 |
| --- | ------------------------ | --------- | -------- |
| 1   | Visual hierarchy         | 9.5       | 9.5      |
| 2   | Typography               | 9.4       | 9.4      |
| 3   | Colour & state semantics | 9.6       | 9.6      |
| 4   | Layout & spacing         | 9.4       | 9.4      |
| 5   | Consistency              | 9.3       | 9.4      |
| 6   | Brand distinctiveness    | 9.7       | 9.6      |
| 7   | Clarity & density        | 9.4       | 9.4      |
| 8   | Interaction states       | 9.1       | 9.3      |
| 9   | Light/dark parity        | 9.6       | 9.5      |
| 10  | Craft & polish           | 9.3       | 9.2      |
| 11  | Accessibility            | 9.1       | 9.4      |
| 12  | Responsive               | 9.3       | 9.3      |
| 13  | Motion                   | 9.4       | 9.5      |
| 14  | Copy                     | 9.5       | 9.4      |
|     | **OVERALL**              | **9.3**   | **9.4**  |

### Round-4 verification

All six must-fixes fixed: approval keys stay put from a composer, ⌘K and the mobile nav; focus
lands on the card with a ring after a keyboard decision; every hero clock agrees and the
migration takes the 5.1s it reports; terminals wrap at spaces; manifests are clean; "Paused for
you" is whole (the compact fleet row is better, still cut mid-word). Polish: hero level from 768
to 1680 with 0px movement, no stretched sheet, skipped glyph, whole install transcript, steady
demo terminal, whole-line ArtifactCard preview, still Spinner. Not fixed: a DiffView example line
still overflows. No regressions.

### Must-fix (merged, ranked)

1. **Approval keys decide a prompt that is off screen** (Opus): Ctrl+Enter from the footer
   approved the hero's migration.
2. **Focus drops to `<body>` when the pressed control unmounts** (Fable): PromptQueue Remove and
   Send now, RunHeader Stop, DiffView Accept all / Reject all, Terminal "Show all", BrowserSession
   Resume, AttachmentList Remove; two examples.
3. **Esc with a tooltip showing denies the request** (Fable) and leaves the tooltip up.
4. **AgentTimeline ticks decimal seconds** (Fable) where everything else shows a clock.
5. **StreamingText's caret pulses under reduced motion** (Fable): the data variant outranks
   `motion-reduce`.
6. **BrowserSession target label is clipped** (both): past the frame at 390, ellipsised by 3px
   at 1440.

### Polish (merged)

Wrapped terminal lines have no hanging indent; inline code and paths break at hyphens; CodeBlock
repeats the language beside a filename and truncates the name at 390; DiffView minimal example is
too narrow for its longest line; the fleet summary hides a count after deny; the test terminal's
clock reads 0:02 then "1.8s"; phone labels cut to a few letters (Checkpoints, RunHeader title,
PromptQueue hint, compact fleet); RunHeader compact title cut by 5px with room to spare;
ModelPicker footer clamps mid-item; VoiceDictation minimal is a lone ghost mic; a typing caret in
a BrowserSession example pulses under reduced motion; the dark install well nearly vanishes on the
canvas; the approval card states the decision twice; moderate axe (heading order at 390, duplicate
landmark names); "⌘↵" hard-coded in one manifest line; "Your agent can install it." right column
ends 150px short.

### Verified good (do not touch)

Hero choreography and the shared clock, approval key scoping for composer/⌘K/nav, the ring on the
card after a keyboard decision, focus return from ⌘K/Popover/CommandPalette/ModelPicker, rings on
every stop, 0 running animations under reduced motion on every other page, ember discipline, the
stacked narrow Trace, AgentFleet layouts, DiffView per-hunk flow, home at 390, the components
index and docs pages, axe clean on all 48 pages.
