# Kura UI launch film: research and storyboard

55 s · 1920×1080 · 60 fps · dark graphite · 120 BPM (a beat is 30 frames, a bar is 120).

## What the research gave us (method, not look)

Sources: Basement Studio's write-up of the v0 film, Steve Lemuel's Raycast motion piece, the
Arc launch post-mortem, 9to5Mac on Apple's hidden-cut transitions, Framer's motion-designer brief,
the Remotion Claude Opus 5 launch-film write-up, Remotion's transition docs, and Netflix's
timed-text rules. I could not find frame-by-frame breakdowns of the Linear, Vercel, Cursor or
Stripe films, so their timings are not claimed here.

- **The hook lands by 3 s, with something moving on frame 0.** No slow logo intro. Ours: one dot,
  already pulsing, on the first frame.
- **One use case, not a feature list** (Arc: "90% of the story is use cases"; Linear's agent
  launches follow a request through to the human who approves it). Ours follows one run:
  a request, the agents working, a tool call, the approval that needs you, the result.
- **Carry one object across cuts** (Apple hides cuts in camera moves; Linear gives you one object
  to follow). Ours is the dot: the token that starts the film becomes the glyph's ring, the glyph
  shrinks into the real plan, the ember centre of the approval, the logo's token at the end.
- **Rebuild the UI, don't screen-record it** (Raycast rebuilt components; Framer animates UI by
  hand). Ours renders the real Kura components from `packages/react/src`, with their state
  driven per frame.
- **UI motion at UI speed, camera motion slower.** Fades 8–10 frames; moves about 3× longer on a
  critically damped spring (no overshoot); key presses 1px of travel, as in the library.
- **Stagger that doesn't read as a metronome**: `round(4 × i^0.8)` frames per word.
- **Accelerate, then stop.** Two long shots open; the middle cuts on the bar; the end card holds.
- **Reading time**: every line holds at least `max(50f, chars ÷ 17 × 60) + 15f` once settled.
- **Sound on contact.** One short tick per dot event, under a minimal pulse at 120 BPM; no whooshes.
  The climax is a silence: the music drops out while the approval waits, and returns on the press.
- **End card from the real SVG**: the logo's parts move separately (two walls, one token).

Anti-patterns we avoid: typewriter text, glow, gradients, bounce, a slow logo open, a full-screen
recording, every move on one easing, UI redrawn from memory, cuts that ignore the music.

## Rules we hold (DESIGN.md + the owner's rejections)

Dot language only. Ember only where a person is needed (the approval beat and the agent that
stops for a person). Graphite sheets, sunk wells, keycap buttons. Geist 600 at −0.045em for
headlines (the site hero's setting), Geist Mono for commands and numbers, sentence case.
Left-aligned type on a shared margin, never a centred hero, never a floating dot field. No blur,
no glow, no grain, no gradients on surfaces. Opacity and transform only, on springs.
Everything is a function of the frame, so every render is identical.

## Storyboard

| #   | Time      | Frames    | Shot                                                                                                                                                                                                                                                                                                                                                                      | Sound                                                                |
| --- | --------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1   | 0:00–0:04 | 0–240     | **One token.** A single dot, the live edge, pulses at centre-left. It emits: tokens stream right as a row of dots, one per sixteenth. Type rises word by word: "Agents work in tokens."                                                                                                                                                                                   | A tick per dot; nothing else yet.                                    |
| 2   | 0:04–0:10 | 240–600   | **The problem.** The row wraps into lines and the lines pile up fast, a wall of work. Then all of it collapses into the thing most apps show instead: one grey spinner and "Thinking…". Type: "Most interfaces show you a spinner."                                                                                                                                       | Ticks accelerate into a roll; cut to silence.                        |
| 3   | 0:10–0:18 | 600–1080  | **Match cut: the spinner breaks into eight dots.** The site's hero glyph (25×25 matrix, ring of radius 9) lives through its states: queued, running, needs you (ember, blinking centre), done (disc fills from the middle). The state word sits beside it on each beat. Type: "Kura draws the work."                                                                      | Pulse starts on the cut. Kick on "Done".                             |
| 4   | 0:18–0:26 | 1080–1560 | **Into the product.** The big glyph shrinks into the 15px glyph of the real `TaskList` row; the camera pulls out to the full run stage (RunHeader, Plan, Subagents with sigils, Trace, Terminal, Context). Steps tick to done on the beat, the test suite streams, context fills its hundred dots. Short captions: "Every agent has a face." "Context is a hundred dots." | Full groove. A tick on each rail advance.                            |
| 5   | 0:26–0:32 | 1560–1920 | **Needs you.** The migrator asks. Ember arrives: halftone corner, ember glyph, "Needs you". The camera pushes into the `ApprovalPrompt`. Type: "Ember means it needs you." The keycap "Run migration ⏎" is pressed (1px travel); ember leaves the screen and the whole view moves on together.                                                                            | Music drops out under the ask. Press = click, then the beat returns. |
| 6   | 0:32–0:42 | 1920–2520 | **Agent-ready.** "Your agent can use it, too." A ui-sdk agent reads the page by name (`agent.snapshot()` lists the surfaces in a well, dotted leaders) and acts (`agent.act(…)`): its pointer accepts the diff hunk. Then it reaches the deploy key marked `data-agent-confirm` and stops: ember, "waiting for a person".                                                 | Ticks on each snapshot line.                                         |
| 7   | 0:42–0:48 | 2520–2880 | **Install.** "Your agent can install it." A sunk well: `npx @kura-ui/cli add approval-prompt` is entered, the files land with done glyphs; then the MCP line `npx -y @kura-ui/mcp`.                                                                                                                                                                                       | Pulse thins out.                                                     |
| 8   | 0:48–0:55 | 2880–3300 | **End card.** Everything collapses to one dot, the token from frame 0. The two stepped walls of the logo slide in along the diagonal and lock around it. "Kura" and `kuro.abstergo.fyi`. Holds.                                                                                                                                                                           | A low chord on the lock; ring out.                                   |

Light mode: not used. The film is one continuous graphite space; a light beat would be a second
look for a 55 s piece and did not earn a place.

Voice: left out on purpose. The story is one run from request to approval; a voice beat would
turn it back into a feature list.

## As built (changes from the plan above)

- Shot 1 opens close on the first dot (4.2× scale) and pulls back as the tokens start, so the
  first frame is a bold live dot rather than a speck on the margin.
- Shot 2: the wall does not "collapse into a spinner" by morphing; it falls towards the spinner's
  centre (nearest first, accelerating in, shrinking) and the spinner fades up where it landed.
- Shot 3: the spinner's arc and the glyph's chasing light share a phase, so the cut lands on the
  same angle. The matrix is the site's (25×25, midpoint-circle ring of radius 9), rebuilt per frame.
- Shot 4: the caption beats are "Every agent has a face." (the fleet at 2.45×) and "Context is a
  hundred dots." (the context panel filling at 2.2×). Panels out of focus drop to 5% opacity.
- Shot 5: the person's pointer is a plain arrow; the agent's pointer wears the agent's name tag.
- Shot 6 has its own camera: wide while the agent reads, in close on the diff and on the prompt,
  wide for the stop. It is 10 s, which moved the install and the end card back a second.
- Shot 7: the CLI output follows `kura add` (green `+` for each file written, the tokens file,
  the import line); the four ways in are the site's own list (registry, MCP, CLI, llms.txt).
