# Kura UI launch film

A 55 s, 1920×1080, 60 fps launch film made with [Remotion](https://remotion.dev) from the
library's own components. The story and the research behind it are in `STORYBOARD.md`.

```sh
cd video
pnpm install          # its own pnpm root: Remotion stays out of the library's workspace
pnpm audio            # synthesise the soundtrack → public/audio/kura-launch.wav
pnpm render           # → out/kura-launch.mp4
pnpm studio           # scrub it in Remotion Studio
node scripts/stills.mjs 600 1080 1700           # stills → out/stills/
python3 scripts/sheet.py sheet.png 4 600 1080   # a contact sheet of those stills
```

How it works:

- **Real components.** Scenes import the library's source from `packages/react/src` (alias
  `@kura`) with Kura's tokens and Tailwind v4 (`src/styles.css`). Nothing is screen-recorded.
- **Deterministic.** Every state is a function of the frame. `src/lib/clock.ts` gives the
  library a film clock (`Date.now` and, via webpack, `useElapsed`); `src/lib/frame-sync.tsx`
  pauses every CSS animation (the chase, the blink, the live dot) and seeks it to the frame;
  CSS transitions are off; `useReducedMotion` is shimmed so JS tweens settle and the film
  drives them.
- **Camera.** `src/lib/camera.tsx` frames measured DOM elements, travelling in log-scale so a
  zoom stays anchored; it measures before paint, so there is no flicker.
- **Sound.** `scripts/synth.mjs` synthesises the track from sines and noise (no samples), with
  every tick placed on a frame the picture uses.

The folder is outside the library's pnpm workspace on purpose; `pnpm check` at the root only
lints it (Biome). Rendered media (`out/`) and the generated audio (`public/audio/`) are ignored.
