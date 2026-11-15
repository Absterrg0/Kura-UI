import { Audio, Sequence, staticFile } from "remotion";
import { RAMP } from "./shots/ramp";
import { B } from "./timing";

/**
 * Sparse sound on contact: a tick where a dot lands that matters (the full stop, each ring dot,
 * each face, each cut of the ramp), a low thump on the stop. Everything else is the music.
 */
type Cue = { frame: number; sound: "tick" | "tick-lo" | "key" | "thump"; volume: number };
export const CUES: Cue[] = [
  { frame: B(7), sound: "tick-lo", volume: 0.5 },
  // The ring draws itself clockwise from twelve: one tick per dot as it condenses.
  ...Array.from({ length: 8 }, (_, k) => ({
    frame: B(9.05) + k * 2 + 14,
    sound: "tick" as const,
    volume: 0.32,
  })),
  { frame: B(13), sound: "tick-lo", volume: 0.55 },
  { frame: B(16), sound: "tick", volume: 0.4 },
  { frame: B(17), sound: "tick", volume: 0.4 },
  { frame: B(18), sound: "tick", volume: 0.4 },
  { frame: B(21), sound: "tick-lo", volume: 0.45 },
  ...RAMP.map((r, i) => ({
    frame: B(r.at),
    sound: (i % 2 ? "tick" : "tick-lo") as Cue["sound"],
    volume: 0.3 + i * 0.03,
  })),
  { frame: B(32), sound: "thump", volume: 0.8 },
  { frame: B(33), sound: "tick", volume: 0.45 },
  { frame: B(34), sound: "tick-lo", volume: 0.5 },
];

export function Sfx() {
  return (
    <>
      {CUES.map((c, i) => (
        <Sequence key={i} from={c.frame} durationInFrames={40} name={`sfx ${c.sound}`}>
          <Audio src={staticFile(`audio/sfx/${c.sound}.wav`)} volume={c.volume} />
        </Sequence>
      ))}
    </>
  );
}
