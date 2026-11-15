# Kura UI launch film

The launch film, made with [Remotion](https://remotion.dev) from the library's own components and
cut to a licensed track. v3 is the full film (53.9 s).

- `SCRIPT.md`: the copy, three candidate scripts and why one was chosen, mapped to the beats.
- `STORYBOARD.md`: the v3 shot list on the beat grid (and the v2 proof, as history).
- `research/BREAKDOWN.md`: nine launch films analysed frame by frame, and the techniques taken.
- `MUSIC.md`: the track, its licence, the beat map.

```sh
cd video
pnpm install                 # its own pnpm root: Remotion stays out of the library's workspace
pnpm music                   # fetch, verify and trim the track → public/audio/kraft-twerk.wav
pnpm sfx                     # synthesise the dot ticks → public/audio/sfx/
pnpm render:film             # → out/kura-launch-v3.mp4 (1920×1080, 60 fps, H.264 + AAC)
pnpm render:proof            # → out/proof-v2.mp4 (the v2 proof)
pnpm studio                  # scrub it in Remotion Studio
COMP=KuraLaunchSilent OUT=out/stills SCALE=0.5 node scripts/stills.mjs 0 244 488   # draft stills
scripts/sheet.sh out/stills out/sheet.png                    # tile them into a contact sheet
```

How it works:

- **The beat map drives the edit.** `src/film/beatmap.json` (from `scripts/beatmap.py`) gives the
  beat length; `B(beat)` in `src/film/timing.ts` turns beats into frames. Shots are listed in
  beats in `src/film/proof.tsx`.
- **Dots have their own camera.** `src/film/proj.ts` projects world points through a pinhole
  camera (target, distance, yaw, pitch, roll); each dot is drawn as an SVG disc with the affine
  transform of its plane, so macros stay crisp and tilted dots flatten correctly. Geometry comes
  from the library: the glyph's ring (`src/film/glyph.ts`, with the kura-chase keyframes), the
  sigil's faces (`agentSigilPattern`), DotRail and ContextPanel proportions.
- **Real components on planes.** `src/film/plane.tsx` lays a component out at CSS `zoom` and turns
  it in CSS 3D. Their state is driven by the frame (controlled props, `now`, statuses per
  sixteenth).
- **Type ↔ dots.** `src/film/text-dots.ts` rasterises a word in Geist and samples it on a grid,
  in the same baseline coordinates as the SVG text, so a word can be scanned into dots and back.
- **Deterministic.** Every value is a function of the frame. `src/lib/clock.ts` gives the library
  a film clock; `src/lib/frame-sync.tsx` seeks the library's CSS loops to the frame; CSS
  transitions are off.

Rendered media (`out/`), the track and the effects (`public/audio/`) are git-ignored.
