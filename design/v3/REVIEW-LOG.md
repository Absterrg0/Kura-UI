# v3 review log — the dot language (council method)

Two review-only reviewers per round: **Fable 5.2 (high effort)** and **Opus 5.5 (extra-high
effort)**. Fixed 14-shot set (`design/v3/shots.mjs`), scored on the 14-category rubric
(`RUBRIC.md`) against `DIRECTION.md`. A round passes when **both** score ≥ 9.5 with no Must-fix.

History before v3: the v2 direction ("Raycast-grade dark") reached 7.3 (R1) and 7.9 (R2) with one
reviewer (`design/v2/REVIEW-LOG.md`). The owner then rejected the look itself; v3 replaces it.

| Round | Fable 5.2 | Opus 5.5 | Notes                                                                                                                                               |
| ----- | --------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1    | 8.0       | 7.8      | First full build on the dot language (commit 519f6c7). Identity lands (brand 9.0 from both); focus rings, mobile docs and loose edges hold it back. |

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
