// Synthesises the film's few sound effects (no samples): dot ticks, a key press, a low stop.
// Output: public/audio/sfx/*.wav (git-ignored). Deterministic: the noise is seeded.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const SR = 48000;
const dir = path.join(process.cwd(), "public/audio/sfx");
mkdirSync(dir, { recursive: true });

let seed = 7;
const noise = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2 ** 31 - 1;
};

function wav(name, seconds, fn) {
  const n = Math.round(SR * seconds);
  const data = Buffer.alloc(44 + n * 2);
  data.write("RIFF", 0);
  data.writeUInt32LE(36 + n * 2, 4);
  data.write("WAVEfmt ", 8);
  data.writeUInt32LE(16, 16);
  data.writeUInt16LE(1, 20);
  data.writeUInt16LE(1, 22);
  data.writeUInt32LE(SR, 24);
  data.writeUInt32LE(SR * 2, 28);
  data.writeUInt16LE(2, 32);
  data.writeUInt16LE(16, 34);
  data.write("data", 36);
  data.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const v = Math.max(-1, Math.min(1, fn(t)));
    data.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  writeFileSync(path.join(dir, `${name}.wav`), data);
}

const attack = (t, a) => Math.min(1, t / a);

// A dot: a short, bright, pitched click. The high one marks a token; the low one a state change.
const dot = (f, decay, gain) => (t) =>
  gain *
  attack(t, 0.0008) *
  Math.exp(-t / decay) *
  (Math.sin(2 * Math.PI * f * t) * 0.8 +
    Math.sin(2 * Math.PI * f * 2.01 * t) * 0.2 +
    noise() * 0.12 * Math.exp(-t / 0.002));
wav("tick", 0.08, dot(3150, 0.011, 0.55));
wav("tick-lo", 0.1, dot(1580, 0.016, 0.6));

// A keycap: a muted down-click and, 70 ms later, the lighter up-click.
const click = (t, f, g) =>
  t < 0 ? 0 : g * Math.exp(-t / 0.006) * (noise() * 0.7 + Math.sin(2 * Math.PI * f * t) * 0.5);
wav(
  "key",
  0.25,
  (t) =>
    click(t, 900, 0.8) +
    0.5 * Math.exp(-t / 0.04) * Math.sin(2 * Math.PI * 160 * t) * attack(t, 0.002) +
    click(t - 0.07, 1400, 0.35),
);

// A low stop: a short sub thump under a hard cut to silence.
wav(
  "thump",
  0.6,
  (t) =>
    0.9 *
    attack(t, 0.003) *
    Math.exp(-t / 0.16) *
    Math.sin(2 * Math.PI * (52 + 40 * Math.exp(-t / 0.03)) * t),
);

console.log("public/audio/sfx: tick, tick-lo, key, thump");
