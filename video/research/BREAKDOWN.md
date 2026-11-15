# What the best launch films do: a frame-level breakdown

Nine films were downloaded and analysed frame by frame on 2026-11-15. YouTube refused this server
("Sign in to confirm you're not a bot", in yt-dlp with every player client and in Chrome on the
desktop), so every film came from X or from the company's own CDN. The media lives outside git, in
the session scratchpad.

Method, per film: cuts detected with
`ffmpeg -vf "scale=480:-2,select='gt(scene,T)',showinfo"` (T = 0.3, and 0.1 for the dark films
whose cuts hide in near-black frames; double triggers under 4 frames merged), shot count and
average shot length (ASL) from those cuts, a 2 fps contact sheet of the whole film, before/after
frames for every cut, and 8 fps strips across the key transitions. Beats and onsets came from
`aubio beat` / `aubio onset`. All sheets were looked at, not just measured.

| Film (source)                                                                                          | Length | Shots | ASL     | Median | Register                                |
| ------------------------------------------------------------------------------------------------------ | ------ | ----- | ------- | ------ | --------------------------------------- |
| Framer, "Design and publish websites faster than ever" (2022, x.com/framer/status/1529112253105963009) | 71.2 s | 45    | 1.58 s  | 1.10 s | kinetic type + UI macro, beat-quantised |
| Stripe Sessions 2027 sizzle (b.stripecdn.com/wpp/assets/s27-sizzle.mp4)                                | 89.0 s | 64    | 1.39 s  | 1.07 s | live-action event montage               |
| Raycast, "A New Start" (Raycast for Windows, x.com/thomaspaulmann/status/1991492832272544216)          | 52.8 s | 29    | 1.82 s  | 1.29 s | archival story montage, one hard stop   |
| Framer 3.0 (x.com/framer/status/2066939366568804508)                                                   | 75.0 s | 22    | 3.41 s  | 2.23 s | staged UI on black, continuous camera   |
| Cursor, "Meet the new Cursor" (Cursor 3, x.com/leerob/status/2039771986180649010)                      | 90.3 s | 25    | 3.61 s  | 3.75 s | founders' interview + screen inserts    |
| Linear, "Introducing Linear Agent" (webassets.linear.app …/c8530d6…mp4)                                | 54.9 s | 5     | 10.97 s | 9.77 s | one tilted UI plane, slow camera        |
| Vercel, "Introducing v0" (x.com/v0/status/1712151235715883310)                                         | 47.5 s | 1     | 47.5 s  | —      | one take, everything morphs             |
| The Browser Company, "Meet Dia" (x.com/browsercompany/status/1932800009860272494)                      | 24.1 s | 1     | 24.1 s  | —      | one take, logo → control → UI           |
| Linear, "GitHub loop triggers" changelog film (webassets.linear.app …/9e1278d…mp4)                     | 29.7 s | 1     | 29.7 s  | —      | single locked frame, typed              |

Two families come out of this. **Cut films** (Framer 2022, Stripe, Raycast) run at an ASL of
1.4–1.8 s with shot lengths locked to the music. **Camera films** (Linear Agent, v0, Dia, Framer 3)
have almost no cuts: one continuous space where the camera moves and the elements morph, so the
"edit" happens inside the frame. The strongest moments in all nine come from mixing the two:
a continuous move that ends on a hard cut, or a fast montage that stops dead.

---

## Per film

### Framer 2022, "Design and publish websites faster than ever" — 45 shots, ASL 1.58 s

Shot lengths are whole multiples of one beat, 0.545 s (110 BPM): 0.53/0.57 s (1 beat, alternating
because 16.35 frames rounds both ways at 30 fps), 1.07–1.10 s (2), 1.60–1.63 s (3), 2.17 s (4).

| Time      | Shot                                                                                                                                       | Camera                                                  | Type                                                                      | Transition / music                                     |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------ |
| 0.0–5.2   | Type on black: "What if I told you" → "you can design" → "and ship" → "a website like this"                                                | locked                                                  | Geist-like sans, ~9% of frame height, weight jumps to black on "and ship" | word groups swap on the beat, no animation, hard swaps |
| 4.5       | a site pulled from behind the type, motion-streaked                                                                                        | fast push                                               | —                                                                         | whip-zoom into the first site                          |
| 5.2–9.6   | 8 customer sites, one per beat (0.53–0.57 s)                                                                                               | each a slight push                                      | —                                                                         | hard cuts on every beat                                |
| 10.0–11.3 | "St                                                                                                                                        | " typed in a text box, then "Straight from your canvas" | locked                                                                    | big, bold                                              | typed → snaps to set type |
| 11.3–20.3 | Framer editor; the camera pushes into the properties panel; the headline is cropped by the frame edge ("t from / anvas")                   | continuous push across 4 cuts in one direction          | the page's own headline as image, cropped                                 | motion continues across cuts                           |
| 20.3–30.3 | effects, CMS: blog post cards duplicate into a grid (25 s)                                                                                 | push / pull                                             | —                                                                         | 2- and 3-beat shots                                    |
| 30.3–35.5 | "Generate pages from a CMS" on black → blog pages one per beat                                                                             | locked                                                  | big                                                                       | type card, then 1-beat cuts                            |
| 35.5–40.2 | "By the way…" / "It's fast" → rocket launch footage with "Blazing fast."                                                                   | locked                                                  | very big, cropped by the rocket                                           | comic beat                                             |
| 41.8–48.9 | 12 more sites at one beat each                                                                                                             | —                                                       | —                                                                         | 1-beat cuts, accelerating feel                         |
| 49.0–51.5 | "But" / "there's" / "much" / "more"                                                                                                        | locked                                                  | one word per beat, ~20% of frame height, centred                          | hard word swaps on each beat                           |
| 51.7–61.4 | feature run: type left, UI right ("Layout Grids", "Viewport Pinning", "Pre-built Layouts", "Overlays", "3D Effects", "Publish Prototypes") | slow pushes                                             | left-aligned, 2 lines                                                     | exactly 3 beats each                                   |
| 61.4–64.5 | "Oh" / "and" / "this" / "requires" / "0 0 0" (digits roll like a slot machine) / "code."                                                   | locked                                                  | one word per beat                                                         | the rolling zeroes are the joke and the hit            |
| 64.5–68.0 | "Publish" / "your" / "first" / "site" / "for" / "free"                                                                                     | locked                                                  | one word per beat                                                         | —                                                      |
| 68.0–71.2 | the mark alone, then out                                                                                                                   | locked                                                  | —                                                                         | hold 3 s                                               |

### Stripe Sessions 2027 sizzle — 64 shots, ASL 1.39 s

Live action, so only its edit is relevant here. It opens on a building banner and a phone photo
(frame 0 is already in motion), then 1-beat cuts of arrivals. At 17.6–19.9 s it runs an
**accelerating ramp**: shots of 0.40, 0.40, 0.33, 0.27, 0.27, 0.20, 0.17, 0.27 s (logos on booths)
into a hit at 20.8 s, then relaxes to 0.8–1.4 s shots. A second, smaller ramp at 53.8–54.6 s.
Captions are small subtitles; the cutting carries the energy. 56 % of cuts fall within 50 ms of an
audio onset (chance at this onset density: 46 %), so it cuts on accents more than on a grid.

### Raycast, "A New Start" — 29 shots, ASL 1.82 s

| Time      | Shot                                                                                                                                                                      | Device                                          |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 0.0–1.8   | Windows 95 clouds; the old Start button fades up                                                                                                                          | frame 0 is already a picture                    |
| 1.8–3.8   | "DEAR START BUTTON_" typed on black, terminal type                                                                                                                        | the letter is the voice                         |
| 3.8–23.8  | archival montage: a macro of the Start button with its cursor, childhood photos, Solitaire, Pinball, Counter-Strike, MySpace, "how to kis" typed in a search box, a plane | 0.67–1.96 s shots, every one a different medium |
| 23.8–30.0 | a mouse click → blue screen → the blue screen glitches → "Please wait…"                                                                                                   | sound effect on every cut                       |
| 30.0–34.0 | the Raycast mark drawn as a wire line, one stroke at a time, then shrinking                                                                                               | the longest held shot so far (4.2 s), on black  |
| 34.0–37.8 | CRT keyboards, error dialogs piling up                                                                                                                                    | fast again                                      |
| 37.8–40.7 | Windows 11 power menu: the cursor travels to **Shut down** and clicks                                                                                                     | macro, the cursor is the actor                  |
| 40.7–41.5 | **black and silence**                                                                                                                                                     | the hard stop                                   |
| 41.5–47.5 | the camera rises through cloud into dark space; a window appears; the Raycast window fades in                                                                             | one 12 s continuous move                        |
| 48.0–51.5 | "Discover Raycast" → "Now on Windows" over dark sky                                                                                                                       | serif small type, centred                       |
| 51.5–52.8 | the mark                                                                                                                                                                  | hold                                            |

The cut onto the click and into silence is the whole film's turn: everything before it is noise
and nostalgia, everything after it is one slow, calm move.

### Framer 3.0 — 22 shots (T 0.1), ASL 3.41 s

| Time      | Shot                                                                                                                        | Camera / device                                  |
| --------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| 0.0–2.4   | a sliver of light traces the edge of a panel, the Canvas panel appears                                                      | the reveal is a line drawing the outline         |
| 2.4–7.5   | macro of the branches list, rows arrive one by one                                                                          | slow push, very close                            |
| 7.5–10.1  | **a one-pixel line rotates in 3D and turns to face the camera: it is the Publish button, filling half the frame**           | edge-on plane → face-on (rotateY 90° → 0)        |
| 10.1–14.0 | pull back: the button is now in the toolbar; the Agent tab appears                                                          | match by position                                |
| 14.0–23.5 | wireframe of a page builds, the "HAUS" site fills in; cursors of collaborators (Monika, Paul) move                          | 1–2 s shots, staged panels without window chrome |
| 23.5–30.3 | prompt typed in a chat box; the page updates; three breakpoints side by side                                                |                                                  |
| 30.3–38.2 | "Build a Framer code component…" typed → code → a 3D image wheel; a sphere of dots                                          | continuous                                       |
| 38.2–40.3 | "Works everywhere in Framer" builds word by word, small, on black                                                           |                                                  |
| 40.3–50.3 | **pull back from one app window into a wall of dozens of windows**                                                          | 10 s continuous zoom out                         |
| 50.3–62.5 | "Welcome to a whole new Framer" / "Design with agents" / "Refine on the canvas" / "Ship with your team" over abstract light | word-by-word builds, 4 s each                    |
| 62.5–71.6 | "Framer 3.0" in light, collapses to a line, then the mark                                                                   | hold 5 s                                         |

Its look (blue glow, light streaks) is exactly what Kura rejects; its methods (edge-on reveal,
macro on one control, staged UI with no chrome, pull back to a wall) are not.

### Cursor 3, "Meet the new Cursor" — 25 shots, ASL 3.61 s

A documentary: the two founders at a table (two-shot, singles from two angles) with screen inserts
of the product (agent list, diffs, model picker) every 10–15 s, then the mark on white. Shots are
long because a person is talking. Useful only as the opposite pole: a film carried by a voice.
Kura has no voice, so its film has to be carried by picture and music.

### Linear, "Introducing Linear Agent" — 5 shots, ASL 10.97 s

| Time      | Shot                                                                                                           | Camera                                       |
| --------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 0.0–3.0   | the Linear app as one plane, rotated about 20° and tilted back, very dark, lit only where the content is       | slow drift                                   |
| 3.0–11.0  | the camera tracks down the plane to the "Ask Linear" composer; "Find issues with loading performance" is typed | continuous track, focus falls off with depth |
| 11.0–17.1 | the answer streams in: a list of issues, each row arriving with its status icon                                | slow tilt                                    |
| 17.1–22.0 | "Make a plan to refactor data loading to be optimistic" typed                                                  | cut on the same plane                        |
| 22.0–29.5 | the plan document writes itself: title, overview, a table                                                      | the camera glides across the page            |
| 29.5–35.0 | a diagram draws itself, box by box, in perspective                                                             | continuous                                   |
| 35.0–40.6 | pull back to the whole app, still tilted                                                                       |                                              |
| 40.6–45.1 | back to the chat: "I created the PRD around the issues you surfaced"                                           |                                              |
| 45.1–50.5 | "Linear" with a light sweep → "Linear. At your command." builds left to right                                  |                                              |
| 50.5–54.9 | the mark alone                                                                                                 | hold 4.4 s                                   |

No caption ever explains anything: the prompt typed into the product is the script. The film
never shows a flat, frontal screen; every frame is the same plane seen at an angle.

### Vercel, "Introducing v0" — 1 shot

| Time      | What happens                                                                                                             | Device                          |
| --------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| 0.0–2.5   | the v0 mark is constructed from geometry: construction lines, then the solid mark                                        | the logo is built, not faded in |
| 2.5–3.5   | the mark fades; "What will you ship?" arrives word by word                                                               |                                 |
| 3.5–4.5   | **a line strikes through the question and swells into a black pill around it: the question has become the prompt field** | type → UI morph                 |
| 4.5–13.0  | prompts are typed; finished prompts roll up and away like a slot wheel, the next one rolls in from below                 | vertical roll                   |
| 13.0–28.0 | the generated dashboard appears; the camera zooms into one element, a prompt edits it in place                           | camera, no cut                  |
| 28.5–31.0 | **the UI card flips over in 3D to show its code, then flips back**                                                       | card flip                       |
| 32.0–36.0 | the privacy menu, then zoom out                                                                                          |                                 |
| 37.5–38.5 | **pull back into a grid of many generations**                                                                            | scale reveal                    |
| 39.0–47.5 | "v0.dev" → v0 mark → ▲ → "▲ Vercel", then out to white                                                                   | logo relay                      |

### The Browser Company, "Meet Dia" — 1 shot

The sky (rays of colour) is the only set. The Dia mark rises like a sun, shrinks, and **its disc
eclipses into a grey circle with an arrow: the logo has become the send button (7.3–7.9 s), which
then stretches sideways into the prompt bar (8.0–8.3 s)**; typing starts on the next frame. Chips,
tab cards and answers then fly in and out of that one bar, each use case one prompt. The film ends
on the welcome window. Every transition is a morph of something already on screen.

### Linear, "GitHub loop triggers" — 1 shot

A dark composer; "@Linear create a loop that runs whenever a PR is merged…" is typed in real time
(7 s), sent, and the conversation scrolls as merged PRs arrive as cards. A plain title, "GitHub
loop triggers", then "Now available". The minimum viable film: one product moment, typed, at real
speed. Shown here to mark the floor, not the bar.

---

## Techniques to take (method, not look)

1. **Frame 0 is already a picture, already moving.** No logo intro, no fade from black (Raycast's
   clouds, Stripe's banner, Linear's drifting plane, Framer's type at 0.5 s).
2. **Shot lengths are whole beats.** Framer 2022 cuts on a 0.545 s grid: 1-, 2-, 3- and 4-beat
   shots and nothing in between. A feature run gets exactly 3 beats per feature.
3. **A tempo arc, not a tempo.** Long establishing moves → 2-beat shots → 1-beat shots → a ramp
   below the beat (Stripe: 0.40 → 0.17 s) → a hit or a hold.
4. **One hard stop.** Raycast's click on "Shut down" cuts to black and silence for 0.8 s; the film
   turns on it. Everything after is slower.
5. **Kinetic type, one word per beat, swapped by hard cuts.** Framer's "But / there's / much /
   more": 15–20 % of frame height, no animation between words; the cut is the animation.
6. **Type becomes UI.** v0's question grows a bar and becomes the prompt field it asks you to use.
7. **A shape becomes a control, the control becomes a container.** Dia's mark → send button →
   prompt bar, each a morph of what is already on screen.
8. **The edge-on reveal.** Framer 3's Publish button arrives as a one-pixel sliver (a plane seen
   edge-on) and turns to face the camera. A 3D entrance with no fade and no blur.
9. **Macro on one control.** One button or one row fills half the frame (Framer 3's Publish,
   Raycast's Start button and power menu). Interfaces are shown at the scale of a product shot.
10. **The UI is a plane in space, never a frontal screenshot.** Linear Agent's whole film is one
    tilted plane with a camera tracking across it.
11. **No window chrome.** Panels are pulled out of the app and staged alone (Dia, Framer 3, v0).
12. **Two faces of one card.** v0 flips the UI to its code and back: one object, two meanings.
13. **Pull back to a wall.** One thing becomes one of many (v0's grid, Framer 3's 10 s zoom out):
    the scale moment.
14. **Rolls and counters.** v0's prompt wheel, Framer's rolling "0 0 0": a value changing in place
    reads as mechanism, not as a slide.
15. **Motion continues across the cut.** Framer 2022's push into the property panel keeps its
    direction and speed through four cuts.
16. **The product writes the script.** Linear, Dia and v0 never caption; the prompt typed into the
    product says what the film is about.
17. **Sound lands on UI events.** Raycast puts a sound on every click and every cut; the loudest
    moment is the silence after "Shut down".
18. **Small, plain end cards, held.** Wordmark → one line → the mark alone for 3–5 s (Linear,
    Raycast, Framer). Nothing else moves.
19. **Contrast of register.** A fast cut film needs one long take (Raycast's 12 s rise); a slow
    camera film needs one hard cut. The change of register is what the viewer feels as structure.

What none of them do: replay a landing page, centre a screenshot on black with a caption in the
corner, or move everything on one easing. Those were v1's three faults.

---

## How the Kura film uses them

The proof (`video/out/proof-v2.mp4`) is the first 18.3 s (bars 0–8 of the track); the rest is
outlined in `video/STORYBOARD.md`.

| Technique                         | In the proof                                                                                                                                                                                                      |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 frame 0 is a picture, moving    | frame 0 is one token 750 px across, thumping on the riff's sixteenths                                                                                                                                             |
| 2 whole-beat shots                | every cut is `B(beat)` from the track's beat map; shots are 4, 2, 1, ½ and ¼ beats                                                                                                                                |
| 3 tempo arc                       | two continuous moves (0–2 s, 4–7 s), then 1-beat cuts, then the ramp (½ beat, then sixteenths)                                                                                                                    |
| 4 one hard stop                   | the ramp runs into the track's near-silent pocket at bar 8: one dot, a low thump (the approval's silence at bar 16 comes later)                                                                                   |
| 5 kinetic type                    | "Agents / work / in / tokens." one word per beat, 380 px, hard swaps                                                                                                                                              |
| 6, 7 type → shape → control       | "tokens" is scanned into dots, wraps round the status ring like type on a path and condenses into its eight dots; the done disc becomes the sigil's raised tile                                                   |
| 8 edge-on reveal                  | the five DotRails open from edge-on slivers; the tool calls turn from edge-on to face the camera                                                                                                                  |
| 9 macro                           | the token at 750 px; the status ring at 960 px; sigil tiles at 700 px; real components at 4–5×                                                                                                                    |
| 10, 11 planes in space, no chrome | the dot paragraph, the ring, the wall of faces, the rails and the context matrix are planes in a pinhole camera; the trace, fleet, plan and tool calls are real components on CSS-3D planes larger than the frame |
| 13 pull back to a wall            | test-writer becomes one of 32 faces, lighting up across the wall                                                                                                                                                  |
| 14 rolls and counters             | odometers on the rail and on the context window (72 %)                                                                                                                                                            |
| 15 motion through the cut         | the three face cuts are one continuous orbit; the done disc slides to where the next shot's tile grows                                                                                                            |
| 16 the product writes the script  | the words are the product's own: tokens, agent, face, context; the names are agents' names                                                                                                                        |
| 17 sound on events                | the full stop, each ring dot, each face, each ramp cut tick; the pocket thumps                                                                                                                                    |
| 18 the end card                   | not in the proof; the title in the pocket is the reverse morph: one dot bursts into "Kura UI"                                                                                                                     |
