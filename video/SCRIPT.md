# Kura UI launch film, v3: the script

Written before any v3 code. The owner's verdict on the v2 proof: the copy narrated our design
rationale ("Agents work in tokens", "Every agent has a face", "Context is a hundred dots"). Nobody
watching a launch film cares how a design system was conceived. v3's copy speaks to the person
watching (a developer building an AI product) and says what Kura lets them build. The dots stay on
screen and carry the style. No line talks about them.

## Rules the copy must pass

1. **Viewer**: it speaks to a developer building an AI product (you, your agents, your users).
2. **Benefit**: every line names a capability, a benefit or a feeling of the product. None names the
   design method: no dots, tokens, faces, ember, glyphs, sigils.
3. **Economy**: about 10 on-screen lines in the whole film, most of 1–4 words, kinetic, on the beat.
4. **Clean**: plain and confident; no puns, no hype words (revolutionary, supercharge, magic,
   seamless, unleash), no questions as hooks.
5. **Arc**: agents now do real, long-running work → your users need to see it, follow it, and step
   in when it matters → Kura gives you those pieces → your own agent can drive the same UI → one
   command → logo.
6. **Turn**: the copy has to give the edit a turn, so the first pocket of the track lands on
   something.

## Three candidates

### A. The brief's draft, tightened

> Your agents are doing real work. · Show every step. · Every tool call. / Every diff. / Every
> subagent. · Step in when it matters. · Built for people. Ready for agents. ·
> `npx @kura-ui/cli add approval-prompt` · Kura UI, Components for agent interfaces.

Clear and on-brief, but it is all statement: the hook and the line after it agree with each
other, so nothing is at stake when the music drops at 16.3 s. The hook says "real work" but not
what that work costs a user.

### B. The noun run

> Agents do the work now. · Let your users follow along. · Plans. Traces. Diffs. Approvals. ·
> Nothing ships without a yes. · Your agent can drive it, too. · the command · the end card.

The noun montage reads as a feature list. "Nothing ships without a yes" is a slogan that edges
into a pun, and is not quite true (only what is marked for confirmation waits). "Follow along"
is soft.

### C. The spinner (chosen)

> Your agents run for hours. · Your users see a spinner. · **Kura UI** · Show every step. ·
> Every tool call. / Every diff. / Every subagent. · Step in when it matters. · Your agent can
> drive it. · `npx @kura-ui/cli add approval-prompt` · Kura UI, Components for agent
> interfaces. Open source.

The first two lines are the problem every AI-product developer knows: the agent works for an hour
and the user watches one spinner. They need no explanation, and they give the film a turn. The
spinner is the word that becomes the ring (the v2 type-to-ring wrap now means something: the
word is the thing). In the track's first near-silent pocket that spinner collapses to one dot and
bursts into the name. Everything after the name is the answer, in the product's own nouns.

### Scores (1–5 per rule)

| Rule    | A      | B      | C      |
| ------- | ------ | ------ | ------ |
| Viewer  | 5      | 4      | 5      |
| Benefit | 4      | 4      | 5      |
| Economy | 4      | 3      | 4      |
| Clean   | 5      | 3      | 5      |
| Arc     | 5      | 4      | 5      |
| Turn    | 2      | 3      | 5      |
| Total   | **25** | **21** | **29** |

C wins on the turn: it is the only one that sets up a problem the viewer feels, so the title and
the rest of the film land as the answer. It spends one more line than A (the spinner line). With
the montage's three word-groups counted as one, it stays at ten lines and the end card.

## The final script on the beat grid

Track: "Kraft Twerk", 118 BPM, a beat is 0.5085 s. Bars 0–7 are the sparse riff, bar 8 (16.3 s)
and bar 16 (32.5 s) are near-silent pockets, the build runs from bar 9, the full groove from bar
18 (36.6 s). Every line is set in Geist 600, one word-group per beat, hard swaps, left margin,
sized to fill the frame.

| #   | Beats      | Time        | On screen                                    | Picture under or around it                                                                                                                          |
| --- | ---------- | ----------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 4, 5, 6, 7 | 2.0–4.1 s   | **Your / agents / run / for hours.**         | after the opening macro of an agent writing; the full stop is the live dot, on the riff                                                            |
| —   | 8–16       | 4.1–8.1 s   | (no copy)                                    | the work, wordless: subagents at work, the fleet lighting up, progress rails, the context filling                                                   |
| 2   | 16, 17, 18 | 8.1–9.7 s   | **Your users / see / a spinner.**            | the word "spinner." becomes a dot matrix and wraps into a running ring, which is laid down and orbited, then intercut with the hidden work, faster |
| 3   | 33–36      | 16.8–18.3 s | **Kura UI**                                  | the pocket: the spinner collapses to one dot, which bursts into the name, full width                                                                |
| 4   | 36, 37, 38 | 18.3–19.8 s | **Show / every / step.**                     | the full stop opens into the running step of a real plan, and the camera pulls back; steps tick to done                                            |
| 5   | 44         | 22.4 s      | **Every tool call.**                         | ToolCall rows turn from edge-on and succeed on the sixteenths                                                                                       |
| 6   | 47         | 23.9 s      | **Every diff.**                              | DiffView, large, the camera running down the hunk                                                                                                   |
| 7   | 50         | 25.4 s      | **Every subagent.**                          | AgentFleet, agents finishing on the sixteenths; then the terminal; then the accelerating run                                                       |
| 8   | 65, 66     | 33.1–34.1 s | **Step in / when it matters.**               | the second pocket: a hard stop on one waiting glyph; then the real ApprovalPrompt; a person clicks _Run migration_ on the downbeat of bar 17         |
| 9   | 74, 75     | 37.6–38.6 s | **Your agent / can drive it.**               | after the wave of done; then `agent.snapshot()` lists the UI by name, the agent presses _Accept all_ by name, and stops at the confirm key, waiting |
| 10  | 84–90      | 42.7–45.8 s | **`npx @kura-ui/cli add approval-prompt`**   | typed huge in a sunken well; the files land                                                                                                         |
| —   | 92–96      | 46.8–48.8 s | (no copy)                                    | pull back to a wall of the components, live; it collapses to one dot                                                                                |
| 11  | 96–106     | 48.8–53.9 s | **Kura UI** · Components for agent interfaces. · Open source · kuro.abstergo.fyi | the wall collapses to one dot; the token-gate mark's two stepped walls slide in along the diagonal and lock round it                              |

Agent names (migrator, reviewer, test-writer), the prompt's own strings ("Run the migration on
production", "Needs you") and code are the product writing on screen, not copy.

Facts on screen, checked in the repo on 2026-11-15: `npx @kura-ui/cli add <slug>`
(packages/cli), MIT licence (LICENSE, every package.json) for "Open source", the site
kuro.abstergo.fyi (README), `createAgent` / `snapshot()` / `act()` and the confirm-before-acting
rule (`approval-prompt.test.tsx`: approving waits for a person and is told "Runs pnpm db:migrate").

## After the independent review

The first cut used the brief's "Built for people. Ready for agents." for line 9. The reviewer, who
had not seen the work, flagged it as a stock AI-marketing slogan: symmetric, and specific to
nothing. It is now "Your agent / can drive it.", which names the capability the next eight beats
show. The reviewer also called the montage line ("Every tool call. / Every diff. / Every
subagent.") a feature list. It stays: it is the owner's own draft, and each group is followed at
once by the component it names.
