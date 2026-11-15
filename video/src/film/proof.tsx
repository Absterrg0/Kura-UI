import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { setFilmTime } from "../lib/clock";
import { FrameSync } from "../lib/frame-sync";
import { Sfx } from "./sfx";
import { FACES_FROM, FaceCuts, FaceIntro, FaceWall } from "./shots/faces";
import { CONTEXT_FROM, Context, RAIL_FROM, Rail } from "./shots/measure";
import { MFleet, MPlan, MTools, MTrace } from "./shots/montage";
import { Ramp } from "./shots/ramp";
import { RING_FROM, Ring } from "./shots/ring";
import { TITLE_FROM, Title } from "./shots/title";
import { Tokens } from "./shots/tokens";
import { WORDS_FROM, Words } from "./shots/words";
import { B } from "./timing";

/** The edit: every shot starts and ends on a beat of the track (beats, not frames). */
export const SHOTS = [
  { id: "tokens", from: 0, to: WORDS_FROM, C: Tokens },
  { id: "words", from: WORDS_FROM, to: RING_FROM, C: Words },
  { id: "ring", from: RING_FROM, to: FACES_FROM, C: Ring },
  { id: "face", from: FACES_FROM, to: 16, C: FaceIntro },
  { id: "face-cuts", from: 16, to: 19, C: FaceCuts },
  { id: "face-wall", from: 19, to: RAIL_FROM, C: FaceWall },
  { id: "rail", from: RAIL_FROM, to: CONTEXT_FROM, C: Rail },
  { id: "context", from: CONTEXT_FROM, to: 24, C: Context },
  { id: "trace", from: 24, to: 26, C: MTrace },
  { id: "fleet", from: 26, to: 27, C: MFleet },
  { id: "plan", from: 27, to: 28, C: MPlan },
  { id: "tools", from: 28, to: 29, C: MTools },
  { id: "ramp", from: 29, to: TITLE_FROM, C: Ramp },
  { id: "title", from: TITLE_FROM, to: 36, C: Title },
] as const;

export const PROOF_FRAMES = B(SHOTS.at(-1)!.to);

export function Proof({ audio = true }: { audio?: boolean }) {
  const frame = useCurrentFrame();
  setFilmTime((frame / 60) * 1000);
  return (
    <AbsoluteFill className="dark bg-kura-canvas font-kura-sans text-kura-fg">
      <FrameSync />
      {SHOTS.map(({ id, from, to, C }) => (
        <Sequence key={id} from={B(from)} durationInFrames={B(to) - B(from)} name={id}>
          <C />
        </Sequence>
      ))}
      {audio && <Audio src={staticFile("audio/kraft-twerk.wav")} volume={0.78} />}
      {audio && <Sfx />}
    </AbsoluteFill>
  );
}
