import { Audio, Sequence, staticFile } from "remotion";
import { B } from "./timing";

type Cue = {
  at: number;
  sound: "tick" | "tick-lo" | "key" | "thump";
  volume: number;
  offset?: number;
};
/** Sparse sound on contact; everything else is the music. Times in beats (+ frames). */
const tick = (at: number, volume = 0.32, offset = 0): Cue => ({
  at,
  sound: "tick",
  volume,
  offset,
});
const lo = (at: number, volume = 0.5, offset = 0): Cue => ({
  at,
  sound: "tick-lo",
  volume,
  offset,
});
export const FILM_CUES: Cue[] = [
  // The hook: the full stop lands.
  lo(7),
  // Subagents, one a beat; the wall.
  tick(8, 0.36),
  tick(9, 0.36),
  tick(10, 0.36),
  lo(11, 0.42),
  // "a spinner." lands; the ring condenses dot by dot, clockwise (see Type: wrapB + 18 + 2k).
  lo(18),
  ...Array.from({ length: 8 }, (_, k) => tick(19.85, 0.28, 18 + k * 2)),
  // The spinner cuts, rising into the pocket.
  ...[24, 26, 27, 28, 28.5, 29, 29.5, 30, 30.5, 31, 31.5].map((b, i) =>
    i % 2 ? tick(b, 0.24 + i * 0.02) : lo(b, 0.3 + i * 0.02),
  ),
  // The pocket: the spinner stops; the name.
  { at: 32, sound: "thump", volume: 0.8 },
  tick(33, 0.42),
  lo(34, 0.5),
  // "step." and the plan.
  lo(38),
  tick(39, 0.34),
  tick(40.5, 0.22),
  tick(41, 0.22),
  tick(41.5, 0.22),
  lo(44, 0.42),
  tick(45.5, 0.22),
  tick(45.75, 0.22),
  tick(46.25, 0.24),
  lo(47, 0.42),
  lo(50, 0.42),
  // The run, faster.
  ...[56, 57, 58, 59, 60, 60.5, 61, 61.5, 62].map((b, i) => tick(b, 0.2 + i * 0.025)),
  lo(63.5, 0.55),
  // The hard stop; the press.
  { at: 64, sound: "thump", volume: 0.85 },
  lo(65, 0.45),
  lo(66, 0.45),
  lo(66.5, 0.4),
  { at: 68, sound: "key", volume: 0.95 },
  // Everything goes done, ring by ring.
  ...Array.from({ length: 8 }, (_, d) => tick(72 + d * 0.25, 0.3 - d * 0.02)),
  lo(74, 0.45),
  lo(75, 0.45),
  tick(76.25, 0.25),
  tick(76.5, 0.25),
  tick(76.75, 0.25),
  { at: 80, sound: "key", volume: 0.55 },
  lo(82, 0.6),
  // The command runs; the files land.
  { at: 88, sound: "key", volume: 0.85 },
  ...Array.from({ length: 6 }, (_, i) => tick(88.5 + i * 0.25, 0.26)),
  // The wall collapses to the dot; the mark locks round it on the beat.
  lo(96, 0.5),
  { at: 97, sound: "thump", volume: 0.7 },
  tick(97, 0.5),
  lo(98.5, 0.45),
  tick(99.5, 0.3),
  tick(100.5, 0.3),
];

export function FilmSfx() {
  return (
    <>
      {FILM_CUES.map((c, i) => (
        <Sequence
          key={i}
          from={B(c.at) + (c.offset ?? 0)}
          durationInFrames={40}
          name={`sfx ${c.sound}`}
        >
          <Audio src={staticFile(`audio/sfx/${c.sound}.wav`)} volume={c.volume} />
        </Sequence>
      ))}
    </>
  );
}
