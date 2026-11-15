import type * as React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { setFilmTime } from "../lib/clock";
import { FrameSync } from "../lib/frame-sync";
import { FilmSfx } from "./film-sfx";
import { ShotOrigin } from "./shot";
import { AgentAsks, AgentDiff, Approve, Snapshot } from "./shots/approval";
import { EndCard } from "./shots/endcard";
import { FaceCuts, FaceWall } from "./shots/faces";
import { EmberMacro, GlyphWall } from "./shots/glyphs";
import { Install } from "./shots/install";
import { Context, Rail } from "./shots/measure";
import { Ring } from "./shots/ring";
import { Diff, Fleet, PlanReveal, Term, Tools, Trace } from "./shots/run";
import { Rush } from "./shots/rush";
import { SpinnerCuts, Title } from "./shots/spinner";
import { Tokens } from "./shots/tokens";
import { Type } from "./shots/type";
import { Wall } from "./shots/wall";
import { B, riffBeats } from "./timing";

type Shot = {
  id: string;
  /** Beats of the track. */
  from: number;
  to: number;
  el: React.ReactNode;
  /** The beat the shot's own timeline starts at, when it is not `from` (a reused shot). */
  origin?: number;
};

/** The edit. Every shot starts and ends on a beat of the track. */
export const FILM: Shot[] = [
  // --- 0:00 the riff. Agents at work; the user sees a spinner.
  { id: "tokens", from: 0, to: 4, el: <Tokens /> },
  {
    id: "hook",
    from: 4,
    to: 8,
    el: (
      <Type
        hits={riffBeats(4, 8)}
        groups={[
          { text: "Your", at: 4 },
          { text: "agents", at: 5 },
          { text: "run", at: 6 },
          { text: "for hours.", at: 7 },
        ]}
      />
    ),
  },
  { id: "faces", from: 8, to: 11, origin: 16, el: <FaceCuts /> },
  { id: "wall", from: 11, to: 13, origin: 19, el: <FaceWall /> },
  { id: "rail", from: 13, to: 14.5, origin: 21, el: <Rail /> },
  { id: "context", from: 14.5, to: 16, origin: 22.5, el: <Context /> },
  {
    id: "spinner-line",
    from: 16,
    to: 21,
    el: (
      <Type
        hits={riffBeats(16, 21)}
        wrap={19}
        groups={[
          { text: "Your users", at: 16 },
          { text: "see", at: 17 },
          { text: "a spinner.", at: 18 },
        ]}
      />
    ),
  },
  { id: "ring", from: 21, to: 24, origin: 10, el: <Ring done={false} /> },
  { id: "spinner-cuts", from: 24, to: 32, el: <SpinnerCuts /> },
  { id: "title", from: 32, to: 36, el: <Title /> },

  // --- 0:18.3 the build. What Kura lets you show.
  {
    id: "show",
    from: 36,
    to: 39,
    el: (
      <Type
        groups={[
          { text: "Show", at: 36 },
          { text: "every", at: 37 },
          { text: "step.", at: 38 },
        ]}
      />
    ),
  },
  { id: "plan", from: 39, to: 42, el: <PlanReveal /> },
  { id: "trace", from: 42, to: 44, el: <Trace /> },
  { id: "w-tools", from: 44, to: 45, el: <Type groups={[{ text: "Every tool call.", at: 44 }]} /> },
  { id: "tools", from: 45, to: 47, el: <Tools /> },
  { id: "w-diff", from: 47, to: 48, el: <Type groups={[{ text: "Every diff.", at: 47 }]} /> },
  { id: "diff", from: 48, to: 50, el: <Diff /> },
  { id: "w-sub", from: 50, to: 51, el: <Type groups={[{ text: "Every subagent.", at: 50 }]} /> },
  { id: "fleet", from: 51, to: 53, el: <Fleet /> },
  { id: "term", from: 53, to: 56, el: <Term /> },
  { id: "rush", from: 56, to: 62, el: <Rush /> },
  {
    id: "glyph-rush",
    from: 62,
    to: 64,
    el: (
      <GlyphWall
        from={62}
        to={64}
        ember={63.5}
        cams={[
          { tx: 0, ty: 0, tz: 0, dist: 520, yaw: -38, pitch: 34, roll: -6, sx: 960, sy: 540 },
          { tx: 0, ty: 0, tz: 0, dist: 260, yaw: -12, pitch: 14, roll: -2, sx: 960, sy: 540 },
        ]}
      />
    ),
  },

  // --- 0:32.5 the pocket: a person decides.
  { id: "ember", from: 64, to: 65, el: <EmberMacro from={64} /> },
  {
    id: "step-in",
    from: 65,
    to: 67,
    el: (
      <Type
        groups={[
          { text: "Step in", at: 65 },
          { text: "when", at: 66 },
          { text: "it matters.", at: 66.5 },
        ]}
      />
    ),
  },
  { id: "approve", from: 67, to: 69, el: <Approve /> },
  {
    id: "wave",
    from: 69,
    to: 74,
    el: (
      <GlyphWall
        from={69}
        to={74}
        approved
        wave={72}
        cams={[
          { tx: 0, ty: 0, tz: 0, dist: 980, yaw: 0, pitch: 0, roll: 0, sx: 960, sy: 540 },
          { tx: 0, ty: 0, tz: 0, dist: 1500, yaw: -24, pitch: 30, roll: -4, sx: 960, sy: 560 },
        ]}
      />
    ),
  },

  // --- 0:37.6 the full groove: ready for agents.
  {
    id: "your-agent",
    from: 74,
    to: 76,
    el: (
      <Type
        groups={[
          { text: "Your agent", at: 74 },
          { text: "can drive it, too.", at: 75 },
        ]}
      />
    ),
  },
  { id: "snapshot", from: 76, to: 78.5, el: <Snapshot /> },
  { id: "agent-diff", from: 78.5, to: 81, el: <AgentDiff /> },
  { id: "agent-asks", from: 81, to: 84, el: <AgentAsks /> },
  { id: "install", from: 84, to: 92, el: <Install /> },
  { id: "wall-of-parts", from: 92, to: 96, el: <Wall /> },
  { id: "end", from: 96, to: 106, el: <EndCard /> },
];

export const FILM_FRAMES = B(FILM.at(-1)!.to);

export function Film({ audio = true }: { audio?: boolean }) {
  const frame = useCurrentFrame();
  setFilmTime((frame / 60) * 1000);
  return (
    <AbsoluteFill className="dark bg-kura-canvas font-kura-sans text-kura-fg">
      <FrameSync />
      {FILM.map(({ id, from, to, el, origin }) => (
        <Sequence key={id} from={B(from)} durationInFrames={B(to) - B(from)} name={id}>
          <ShotOrigin.Provider value={B(origin ?? from)}>{el}</ShotOrigin.Provider>
        </Sequence>
      ))}
      {audio && (
        <Audio
          src={staticFile("audio/kraft-twerk.wav")}
          volume={(f) =>
            0.78 *
            interpolate(f, [FILM_FRAMES - B(2.5), FILM_FRAMES], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          }
        />
      )}
      {audio && <FilmSfx />}
    </AbsoluteFill>
  );
}
