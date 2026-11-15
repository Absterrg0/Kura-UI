import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { setFilmTime } from "./lib/clock";
import { FrameSync } from "./lib/frame-sync";
import { AGENT_FRAMES, Agent } from "./scenes/agent";
import { END_FRAMES, End } from "./scenes/end";
import { Glyph } from "./scenes/glyph";
import { INSTALL_FRAMES, Install } from "./scenes/install";
import { RUN_FRAMES, Run } from "./scenes/run";
import { Tokens } from "./scenes/tokens";

/** The scenes, end to end, each starting on a downbeat (120 BPM, a bar is 120 frames). */
export const SCENES = [
  { id: "tokens", from: 0, frames: 600, Component: Tokens },
  { id: "glyph", from: 600, frames: 480, Component: Glyph },
  { id: "run", from: 1080, frames: RUN_FRAMES, Component: Run },
  { id: "agent", from: 1080 + RUN_FRAMES, frames: AGENT_FRAMES, Component: Agent },
  {
    id: "install",
    from: 1080 + RUN_FRAMES + AGENT_FRAMES,
    frames: INSTALL_FRAMES,
    Component: Install,
  },
  {
    id: "end",
    from: 1080 + RUN_FRAMES + AGENT_FRAMES + INSTALL_FRAMES,
    frames: END_FRAMES,
    Component: End,
  },
] as const;

export const FILM_FRAMES = SCENES.at(-1)!.from + SCENES.at(-1)!.frames;

export function Film({ audio = true }: { audio?: boolean }) {
  const frame = useCurrentFrame();
  // Every clock the library reads is this frame's time.
  setFilmTime((frame / 60) * 1000);
  return (
    <AbsoluteFill className="dark bg-kura-canvas font-kura-sans text-kura-fg">
      <FrameSync />
      {SCENES.map(({ id, from, frames, Component }) => (
        <Sequence key={id} from={from} durationInFrames={frames} name={id}>
          <Component />
        </Sequence>
      ))}
      {audio && <Audio src={staticFile("audio/kura-launch.wav")} />}
    </AbsoluteFill>
  );
}
