import map from "./beatmap.json";

/** The film runs at 60 fps; every cut and hit is a frame derived from the track's beat map. */
export const FPS = 60;
/** One beat of the track (118 BPM), in frames: 30.51. */
export const BEAT = map.beat * FPS;

/** Frame of beat `b` from film time 0 (fractions allowed: 0.25 is a sixteenth). */
export const B = (b: number) => Math.round(b * BEAT);
/** Beat position (fractional) of frame `f`. */
export const beatOf = (f: number) => f / BEAT;

/** The intro riff's hits, in sixteenths of a bar. */
export const RIFF: readonly number[] = map.riff;

/** Beat positions of the riff's hits in [from, to) beats (bars start every 4 beats). */
export function riffBeats(from: number, to: number): number[] {
  const out: number[] = [];
  for (let bar = Math.floor(from / 4); bar * 4 < to; bar++)
    for (const s of RIFF) {
      const b = bar * 4 + s / 4;
      if (b >= from && b < to) out.push(b);
    }
  return out;
}

/** How long ago (in frames) the last of `beats` happened at frame `f`; Infinity if none yet. */
export function sinceLast(f: number, beats: readonly number[]): number {
  let best = Number.POSITIVE_INFINITY;
  for (const b of beats) {
    const d = f - B(b);
    if (d >= 0 && d < best) best = d;
  }
  return best;
}

/** Number of `beats` that have happened by frame `f`. */
export const countBy = (f: number, beats: readonly number[]) =>
  beats.filter((b) => B(b) <= f).length;
