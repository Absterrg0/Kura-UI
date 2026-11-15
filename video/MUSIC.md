# Music

**Kraft Twerk** by Alejandro Magaña (A. M.), from Mixkit.

- Source: https://assets.mixkit.co/music/115/115.mp3 (listed at
  https://mixkit.co/free-stock-music/mood/mechanical/ and /electronica/; Mixkit has no per-track
  pages). sha256 `9de6760a1b3d36f8ea6e9e7106a05b5d63a9a4327ee888f9f396a6ed43c86295`, 2:10.
- Licence: **Mixkit Stock Music Free License**, https://mixkit.co/license/#musicFree (text served
  from https://mixkit.co/license/modal/musicFree/), checked 2026-11-15, and the track's own listing
  data says `"copyrightNotice":"Mixkit Stock Music Free License"`, `"isAccessibleForFree":true`.
  Free for commercial and non-commercial use on any web or social platform, in online ads,
  YouTube and on-demand video; modifying is allowed; no payment, no account, no attribution
  required. Not allowed: TV or radio broadcast, CDs/DVDs, video games, releasing it as a
  music-only track, registering it with Content ID. If a platform raises a claim, Mixkit asks for
  it to be forwarded to team@mixkit.co. A credit is still given in the film's description as a
  courtesy.
- The file is not committed. `node scripts/music.mjs` downloads it, checks the hash and trims it
  so that film time 0 is the downbeat of bar 0 (`src/film/beatmap.json` → `trackOffset`).

## Why this track

Picked from eleven licence-checked candidates (ten Mixkit, one CC0). The choice was made from the
signal, not by ear: spectrograms, chroma, onset envelopes per sixteenth and per-bar loudness.

- 118.0 BPM, a dead-steady grid: a beat is 0.5085 s (30.5 frames at 60 fps), a bar 2.034 s.
- The intro is a sparse, staccato synth-bass riff on sixteenths 0, 3, 4, 5, 6, 8 and 12 of each
  bar, with sharp attacks and space between them: every hit can be a dot. The harmony is static
  and mechanical (no "inspiring corporate" chord movement).
- Its structure is the film's structure: an 8-bar intro (the hook and the first montage), a
  one-bar near-silent pocket at bar 8 (the first stop), a 7-bar build with the top end coming in
  (bars 9–15), a second pocket at bar 16 (the approval: a person decides), and the full groove
  from bar 18 (the hit on the key press).

Rejected: "Minimal Emotion" (filter sweeps that read as risers), "Closer" (a 20 s fade-up, too
slow for a two-second hook), "Minimal Techno 01" (flat and over-compressed), "I'm Under The Radar"
(crisp, but tagged "positive" with moving melodic stabs), "Sonnor" (arpeggio-led, too soft for
cuts).

## Beat map

`scripts/beatmap.py` (numpy + ffmpeg) fits a constant-tempo grid to the onset envelope, picks the
downbeat phase from the low-end attacks, and reports per-bar loudness. Its output is reduced to
`src/film/beatmap.json`, which the composition reads: every cut and hit is a frame computed from
`beat`, never a hand-typed number.

| Bars  | Film time   | Music                        | Film                                           |
| ----- | ----------- | ---------------------------- | ---------------------------------------------- |
| 0–7   | 0.0–16.3 s  | sparse riff; hats from bar 6 | hook, type, the glyph, the first montage       |
| 8     | 16.3–18.3 s | pocket (−20.6 dB)            | the first stop: the title                      |
| 9–15  | 18.3–32.5 s | build, kick on 1 and 3       | the run: agents working, accelerating          |
| 16    | 32.5–34.6 s | pocket (−19.4 dB)            | the approval: silence, ember, a person decides |
| 17–18 | 34.6–38.6 s | the hit, full groove         | the key press releases everything              |
| 19–26 | 38.6–54.9 s | full groove                  | agent-ready, install, end card                 |

Sound effects (the dot ticks) are synthesised by `scripts/sfx.mjs`; they are ours.
