// Fetches the film's licensed track, checks it, and trims it so film time 0 is the downbeat of
// bar 0 (src/film/beatmap.json → trackOffset). Output: public/audio/kraft-twerk.wav (git-ignored).
// Track, source and licence: MUSIC.md.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const map = JSON.parse(readFileSync(path.join(root, "src/film/beatmap.json"), "utf8"));
const dir = path.join(root, "public/audio");
const mp3 = path.join(dir, "kraft-twerk.mp3");
const wav = path.join(dir, "kraft-twerk.wav");
const SHA256 = "9de6760a1b3d36f8ea6e9e7106a05b5d63a9a4327ee888f9f396a6ed43c86295";

mkdirSync(dir, { recursive: true });
if (!existsSync(mp3)) {
  const res = await fetch(map.source);
  if (!res.ok) throw new Error(`Could not fetch ${map.source}: ${res.status}`);
  writeFileSync(mp3, Buffer.from(await res.arrayBuffer()));
}
const sum = createHash("sha256").update(readFileSync(mp3)).digest("hex");
if (sum !== SHA256) throw new Error(`Unexpected track (sha256 ${sum}); see MUSIC.md`);

// -ss after -i: sample-accurate, through the same decoder the beat map was measured with.
execFileSync("ffmpeg", [
  "-v",
  "error",
  "-y",
  "-i",
  mp3,
  "-ss",
  String(map.trackOffset),
  "-ac",
  "2",
  "-ar",
  "48000",
  wav,
]);
console.log(
  `${path.relative(root, wav)}: trimmed at ${map.trackOffset}s, ${map.bpm.toFixed(2)} BPM`,
);
