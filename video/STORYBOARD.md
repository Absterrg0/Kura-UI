# Kura UI launch film, v3

53.9 s · 1920×1080 · 60 fps · graphite and ember · cut to "Kraft Twerk" at 118 BPM (a beat is
0.5085 s, 30.5 frames). The copy and why it was chosen: `SCRIPT.md`. The edit is
`src/film/film.tsx` (every shot in beats); sound cues are `src/film/film-sfx.tsx`. Render:
`pnpm render:film` → `out/kura-launch-v3.mp4`.

What changed from v2 (the proof below): the copy no longer narrates the design system. It tells a
developer what their users see (a spinner) and what Kura gives them instead. The dots stay on
screen. Real components are staged on the raised surface token so they read on film. Ember
appears only on the glyph that waits for a person and on the two approval prompts. The X of the
failed glyph is gone. The end card is the token-gate mark assembling round the dot.

| Beats      | Time        | Shot                                                                                                   | Sound                    |
| ---------- | ----------- | ------------------------------------------------------------------------------------------------------ | ------------------------ |
| 0–4        | 0:00.0      | macro token → an agent writing a page of dots, turned into depth                                       | riff                     |
| 4–8        | 0:02.0      | **Your / agents / run / for hours.** one group a beat; the full stop is the live dot                   | tick on the stop         |
| 8–16       | 0:04.1      | wordless work: three subagents (one beat each), the wall of 32 lighting up, five rails, the context     | tick per cut             |
| 16–21      | 0:08.1      | **Your users / see / a spinner.** → scanned to dots, wrapped round the ring, condensed into eight dots | 8 ticks as dots land     |
| 21–24      | 0:10.7      | the ring running, laid into depth and orbited                                                          |                          |
| 24–32      | 0:12.2      | the spinner intercut with the hidden work, 2 → 1 → ½ beat                                              | tick per cut             |
| 32–36      | 0:16.3      | **pocket**: the spinner collapses to one dot; it bursts into **Kura UI**, full width                   | thump; ticks             |
| 36–39      | 0:18.3      | **Show / every / step.**                                                                               |                          |
| 39–42      | 0:19.8      | the full stop opens into a running ring = the running step of the real TaskList; pull back; steps tick | ticks                    |
| 42–44      | 0:21.4      | TraceWaterfall, spans growing                                                                          |                          |
| 44 / 47 / 50 | 0:22.4    | **Every tool call.** → ToolCalls turn from edge-on · **Every diff.** → DiffView · **Every subagent.** → AgentFleet | tick per word   |
| 53–56      | 0:27.0      | Terminal: the suite streams in, 31 passed                                                              |                          |
| 56–62      | 0:28.5      | the run, faster: crops of timeline, plan, trace, fleet (1 beat), diff, terminal, context, tools (½)    | rising ticks             |
| 62–64      | 0:31.5      | a wall of running glyphs; one turns ember (waiting)                                                    | low tick                 |
| 64–65      | 0:32.5      | **pocket, the hard stop**: the ember glyph alone, its centre blinking                                  | thump                    |
| 65–67      | 0:33.1      | **Step in / when it matters.**                                                                         |                          |
| 67–69      | 0:34.1      | the real ApprovalPrompt; a person clicks _Run migration_ on the downbeat of bar 17                      | key                      |
| 69–74      | 0:35.1      | the approved glyph among running ones; pull back; on bar 18 everything goes done in a wave             | 8 ticks                  |
| 74–76      | 0:37.6      | **Your agent / can drive it.**                                                                         |                          |
| 76–84      | 0:38.6      | `agent.snapshot()` lists the screen by name; the agent presses _Accept all_; it reaches for _Deploy_, which is marked for a person, and waits | ticks; key; low tick |
| 84–92      | 0:42.7      | `npx @kura-ui/cli add approval-prompt` typed into a sunken well; on bar 22 it runs; six files land     | key; ticks               |
| 92–96      | 0:46.8      | pull back from the approved prompt into a wall of every part of the run, live; it collapses to a dot   |                          |
| 96–106     | 0:48.8      | the mark's two stepped walls slide in along the diagonal and lock round the dot; **Kura UI**, Components for agent interfaces., Open source · kuro.abstergo.fyi | thump on the lock |

---

# v2: the proof (history)

~55 s · 1920×1080 · 60 fps · graphite and ember · cut to "Kraft Twerk" at 118 BPM
(a beat is 0.5085 s, 30.5 frames; a bar is 2.034 s). Research: `research/BREAKDOWN.md`.
Music, licence and the beat map: `MUSIC.md`. v1 (rated 2/10) is in commit 5450de0.

## Why v1 failed, and what v2 does instead

v1 replayed the landing page at small scale, centred on black, with corner captions; it moved by
fades and pushes, in six long, flat scenes, cut to a synthesised pulse. v2 takes its methods from
nine launch films watched frame by frame (Framer, Linear, v0, Dia, Raycast, Stripe, Cursor):

- **Components are actors, not pages.** Dots are drawn by a pinhole camera of our own
  (`src/film/proj.ts`) as SVG discs, so a macro of one dot is as crisp as a wide of a thousand,
  and every dot is a disc lying in its plane (it flattens into an ellipse when the plane tilts).
  Real components (TraceWaterfall, AgentFleet, TaskList, ToolCall) are laid out with CSS `zoom`
  and turned in CSS 3D (`src/film/plane.tsx`), always bigger than the frame, never with chrome.
- **The music decides the cuts.** `src/film/beatmap.json` comes from the track; every shot starts
  on `B(beat)`; tokens thump on the riff's sixteenths; the shots shrink from four beats to a
  sixteenth into the track's own near-silent pocket.
- **Type is image.** 380 px Geist 600 at −0.045em, one word per beat, hard swaps; type becomes
  dots (sampled from the glyphs in a canvas, `src/film/text-dots.ts`) and dots become type.
- **Transitions carry the idea.** The full stop is the live token; the word wraps round the
  status ring like type on a path and condenses into its eight dots; the done disc slides to
  where the sigil's tile grows out of it; the title is the token bursting into the name.
- **Nothing linear, nothing that only fades.** Springs with overshoot for landings, anticipation
  on departures, bezier camera moves in log-distance; the chase is the library's own linear loop.

Held from DESIGN.md and the owner's rejections: graphite canvas, ink in three steps, ember only
where a person is needed (it does not appear in the first 18 s), red only for the failed glyph,
no blur, glow, grain, gradients, tints, chrome or sparkles; Geist and Geist Mono only; no centred
hero over a dot field; no boxes in boxes (the only containers are the library's raised tile and
its own sheets).

## The proof: bars 0–8 (0:00–0:18.3), as built

| Beats      | Time   | Shot                                                                                                                       | Camera / device                                                                                          | Sound                |
| ---------- | ------ | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------- |
| 0–1.5      | 0:00.0 | **Macro token**: one dot 750 px across, the next token of its word cut by the left edge                                    | slow push; the dot thumps on every riff hit                                                              | riff only            |
| 1.5–2.5    | 0:00.8 | It is the live edge of a paragraph an agent is writing, in dot-words                                                       | expo pull-back ×28                                                                                       |                      |
| 2.5–4      | 0:01.3 | tokens are written on the sixteenths; the page turns into depth                                                            | yaw −38°, pitch 22°, the camera follows the head                                                         |                      |
| 4, 5, 6, 7 | 0:02.0 | **"Agents / work / in / tokens."** 380 px, left margin                                                                     | hard cuts on the beat, 5 % settle with overshoot, a slow push per word; the full stop drops in on beat 7 | tick on the stop     |
| 8–8.3      | 0:04.1 | "tokens" is scanned into a dot matrix, left to right                                                                       | 9-frame scan                                                                                             |                      |
| 8.3–9.1    | 0:04.2 | **the word wraps round the ring** like type on a path; the full stop rises to twelve                                       | ease in-out                                                                                              |                      |
| 9.05–10    | 0:04.6 | the dots condense, ring dot by ring dot, clockwise: the ring draws itself (queued)                                         | anticipation                                                                                             | 8 ticks              |
| 10–12      | 0:05.1 | **running**: the light chases round the ring (kura-chase, from the film clock)                                             | the ring is laid down into depth (pitch 66°) and orbited                                                 |                      |
| 12–13      | 0:06.1 | face-on again, still running                                                                                               | snap back with overshoot                                                                                 |                      |
| 13–14      | 0:06.6 | **done**: the eight dots close into one disc and slide right                                                               | spring                                                                                                   | tick                 |
| 14–16      | 0:07.1 | the disc becomes a raised tile and a face assembles: **"Every agent / has a face."** (agent "planner")                     | yaw −30° → −16°                                                                                          |                      |
| 16, 17, 18 | 0:08.1 | **migrator, reviewer, test-writer**: one beat each, the name in mono                                                       | one continuous orbit across the three cuts                                                               | tick per cut         |
| 19–21      | 0:09.7 | pull back: test-writer is one of 32 faces; they light across the wall in a wave                                            | ×3.6 pull-back, yaw −34°                                                                                 |                      |
| 21–22.5    | 0:10.7 | **five DotRails** open from edge-on slivers and advance in whole dots on the sixteenths; the odometer reads the front rail | tracking along the rails in depth                                                                        | tick                 |
| 22.5–24    | 0:11.4 | **Context**: ContextPanel's 25 × 4 matrix, shaded by segment, fills to 72 %; the odometer rolls                            | crane from face-on to pitch 52°                                                                          |                      |
| 24–26      | 0:12.2 | the hats enter. **TraceWaterfall** (real) laid back, spans growing on a controlled clock                                   | dolly along the time axis                                                                                |                      |
| 26         | 0:13.2 | **AgentFleet** (real), close; migrator finishes, reviewer starts                                                           | turning                                                                                                  |                      |
| 27         | 0:13.7 | **TaskList** (real), from below; steps tick to done on the sixteenths                                                      |                                                                                                          |                      |
| 28         | 0:14.2 | **ToolCall** ×3 (real), edge-on to face-on; calls succeed on the sixteenths                                                | rotateY −88° → −24°                                                                                      |                      |
| 29–32      | 0:14.7 | **the ramp**: running, failed (red), paused, a sigil (½ beat each), then skipped, queued, running, done (a sixteenth each) | a new angle every cut                                                                                    | tick per cut, rising |
| 32         | 0:16.3 | **the pocket**: the music drops away. One dot.                                                                             | hard cut                                                                                                 | low thump            |
| 33         | 0:16.8 | the dot bursts into the dot matrix of **"Kura UI"**                                                                        | radial, staggered by distance                                                                            | tick                 |
| 34         | 0:17.3 | the dots resolve into type, left to right                                                                                  | 10-frame scan                                                                                            | tick                 |
| 35–36      | 0:17.8 | "Components for agent interfaces."                                                                                         |                                                                                                          |                      |

27 shots in 18.3 s (ASL 0.68 s), but the first 5 s hold two continuous camera moves; the ASL
falls from 2 s to 0.13 s across the section and stops dead in the pocket.

## The rest of the film (to build after sign-off)

| Bars  | Beats   | Time          | Music                         | Shots                                                                                                                                                                                                                                                                                               |
| ----- | ------- | ------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 9–10  | 36–44   | 0:18.3–0:22.4 | build: kick on 1 and 3        | "Give it a task." A Composer (real) at macro scale in 3D; the prompt is typed; the ⏎ keycap pressed at 12× with its 1 px of travel on beat 40; the plan unfolds as a plane and subagents' sigils fly out of its rows into a fleet. 2-beat shots.                                                    |
| 11–12 | 44–52   | 0:22.4–0:26.4 | build                         | "Watch it work." The run as a stage: Plan, Fleet, Trace and Terminal as planes stacked in depth; one 4-beat crane down through them; then 1-beat macros: test output streaming (green passes on the sixteenths), a diff hunk, a tool call.                                                          |
| 13–15 | 52–64   | 0:26.4–0:32.5 | build peaks                   | Accelerating montage of parallel runs; one word per beat over it, huge and cropped by the frame ("Plans." "Traces." "Subagents." "Context."); context climbs to 88 %; the wall of glyphs all running; 1 → ½ → ¼ beat. One glyph turns ember.                                                        |
| 16    | 64–68   | 0:32.5–0:34.6 | **pocket (−19 dB)**           | **The hard stop.** Everything goes dark except one ember glyph, macro, its centre blinking. Push into the ApprovalPrompt (real): the halftone ember corner, "Run the migration on production?". "It needs you." The pointer travels to the key.                                                     |
| 17    | 68–72   | 0:34.6–0:36.6 | re-entry                      | **The press**: keycap macro, 1 px travel, key sound on the downbeat. Ember leaves the screen.                                                                                                                                                                                                       |
| 18–20 | 72–84   | 0:36.6–0:42.7 | full groove                   | The whole view reacts together: every glyph on the wall goes done in a wave. "Your agent can use it, too." `agent.snapshot()` lists the named surfaces in a well; the agent's pointer acts on them by name; it stops at a `data-agent-confirm` key and waits (the ember glyph, once, for one beat). |
| 21–22 | 84–92   | 0:42.7–0:46.8 | full                          | Install as type-as-image: `npx @kura-ui/cli add approval-prompt` in huge mono in a sunk well; the files land as done glyphs on the sixteenths; `npx -y @kura-ui/mcp`.                                                                                                                               |
| 23–24 | 92–100  | 0:46.8–0:50.8 | full                          | Pull back into a wall of every component, live, in perspective: the scale moment.                                                                                                                                                                                                                   |
| 25–26 | 100–108 | 0:50.8–0:54.9 | out on the downbeat of bar 27 | Everything collapses to one dot, the token from frame 0. The logo's two stepped walls (`design/logo/kura-mark.svg`) slide in along the diagonal and lock around it. "Kura UI", kuro.abstergo.fyi. Hold 3 s.                                                                                         |

Target: about 65 shots in 55 s, with the long continuous moves at 0:00, 0:22 and 0:47 and the
only silence at 0:32.5.
