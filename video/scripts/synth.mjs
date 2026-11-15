// The film's soundtrack, synthesised from nothing: no samples, no third-party audio.
// 120 BPM in D major (a bar is 2 s = 120 frames). Every tick lands on a frame the picture uses:
// tokens emitted, lines printed, keys pressed, the walls of the mark closing.
// Writes public/audio/kura-launch.wav (48 kHz, 16-bit stereo). Run: node scripts/synth.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const SR = 48000;
const FPS = 60;
const SECONDS = 55;
const N = SR * SECONDS;
const L = new Float32Array(N);
const R = new Float32Array(N);

// Deterministic randomness.
let seed = 7;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2 ** 32;
};

const at = (frame) => frame / FPS;
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

/** Add a mono signal `fn(t)` for `dur` seconds from `t0`, panned (-1..1). */
function add(t0, dur, fn, gain = 1, pan = 0) {
  const s0 = Math.max(0, Math.round(t0 * SR));
  const s1 = Math.min(N, Math.round((t0 + dur) * SR));
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = s0; i < s1; i++) {
    const v = fn((i - s0) / SR);
    L[i] += v * gl;
    R[i] += v * gr;
  }
}

const env = (t, a, tau) => (t < a ? t / a : Math.exp(-(t - a) / tau));

// --- Voices --------------------------------------------------------------------------------

/** A token: a tiny high sine blip. */
function tick(t0, midi, gain = 0.1, pan = 0) {
  const f = hz(midi);
  add(t0, 0.12, (t) => Math.sin(2 * Math.PI * f * t) * env(t, 0.0015, 0.022), gain, pan);
}

/** The pulse: a soft pluck, sine with a touch of its octave. */
function pluck(t0, midi, gain = 0.1, pan = 0, tau = 0.2) {
  const f = hz(midi);
  add(
    t0,
    tau * 6,
    (t) =>
      (Math.sin(2 * Math.PI * f * t) + 0.22 * Math.sin(4 * Math.PI * f * t) * Math.exp(-t / 0.05)) *
      env(t, 0.004, tau),
    gain,
    pan,
  );
}

/** A pad note: two slightly detuned sines, slow in and out. */
function pad(t0, dur, midi, gain = 0.04) {
  const f = hz(midi);
  const fade = (t) => Math.min(1, t / 0.6, (dur - t) / 0.8) ** 2;
  add(t0, dur, (t) => Math.sin(2 * Math.PI * f * 0.998 * t + 0.3) * fade(t), gain, -0.35);
  add(t0, dur, (t) => Math.sin(2 * Math.PI * f * 1.002 * t) * fade(t), gain, 0.35);
}

/** Sub bass. */
function bass(t0, midi, dur = 0.9, gain = 0.22) {
  const f = hz(midi);
  add(
    t0,
    dur,
    (t) => Math.sin(2 * Math.PI * f * t) * Math.min(1, t / 0.01) * Math.exp(-t / (dur * 0.5)),
    gain,
  );
}

/** A soft kick: a sine that drops from 120 to 45 Hz. */
function kick(t0, gain = 0.5) {
  let phase = 0;
  let last = 0;
  add(
    t0,
    0.35,
    (t) => {
      const f = 45 + 75 * Math.exp(-t / 0.03);
      phase += 2 * Math.PI * f * (t - last);
      last = t;
      return Math.sin(phase) * env(t, 0.002, 0.09);
    },
    gain,
  );
}

/** A closed hat: high-passed noise, very short. */
function hat(t0, gain = 0.035, pan = 0.25) {
  let prev = 0;
  let prevOut = 0;
  add(
    t0,
    0.06,
    (t) => {
      const x = rand() * 2 - 1;
      const y = 0.86 * (prevOut + x - prev);
      prev = x;
      prevOut = y;
      return y * env(t, 0.0008, 0.012);
    },
    gain,
    pan,
  );
}

/** A keycap press: a dull thump and a dry click. */
function key(t0, gain = 0.32) {
  add(t0, 0.08, (t) => Math.sin(2 * Math.PI * 170 * t) * env(t, 0.001, 0.018), gain);
  add(t0, 0.02, (t) => (rand() * 2 - 1) * env(t, 0.0003, 0.003), gain * 0.5);
}

/** Ember: "this needs you". Two soft bell strikes, a falling fourth. */
function ember(t0, gain = 0.09) {
  for (const [dt, midi] of [
    [0, 81],
    [0.25, 76],
  ]) {
    const f = hz(midi);
    add(
      t0 + dt,
      2.2,
      (t) =>
        (Math.sin(2 * Math.PI * f * t) +
          0.25 * Math.sin(2 * Math.PI * f * 2.76 * t) * Math.exp(-t / 0.25)) *
        env(t, 0.003, 0.7),
      gain,
      dt ? 0.2 : -0.2,
    );
  }
}

// --- Harmony -------------------------------------------------------------------------------

// D major, one chord per bar: Dmaj9, Bm9, Gmaj9, A6sus. MIDI notes, low to high.
const CHORDS = [
  { root: 38, tones: [62, 66, 69, 73, 76] },
  { root: 35, tones: [59, 62, 66, 69, 73] },
  { root: 31, tones: [62, 67, 71, 74, 78] },
  { root: 33, tones: [62, 64, 66, 69, 76] },
];
const ARP = [0, 2, 4, 1, 3, 2, 4, 3];
const PENTA = [74, 76, 78, 81, 83, 86, 88, 90, 93, 95];

/** The music between two frames, at a level per layer. */
function groove(fromFrame, toFrame, { pulse = 1, kicks = 0, hats = 0, pads = 1, sub = 1 }) {
  for (let f = fromFrame; f < toFrame; f += 15) {
    const t = at(f);
    const bar = Math.floor(f / 120);
    const chord = CHORDS[bar % 4];
    const eighth = Math.round((f % 120) / 15);
    if (pulse) {
      const midi = chord.tones[ARP[eighth]] + (eighth % 4 === 0 ? 12 : 0);
      pluck(t, midi, 0.075 * pulse * (eighth % 2 ? 0.75 : 1), eighth % 2 ? 0.3 : -0.3);
    }
    if (eighth === 0) {
      if (pads) for (const m of chord.tones.slice(0, 4)) pad(t, 2.1, m - 12, 0.022 * pads);
      if (sub) bass(t, chord.root + 12, 0.95, 0.2 * sub);
    }
    if (eighth === 4 && sub) bass(t, chord.root + 12, 0.8, 0.14 * sub);
    if (kicks && eighth % 2 === 0) kick(t, (eighth % 4 === 0 ? 0.42 : 0.3) * kicks);
    if (hats && eighth % 2 === 1) hat(t, 0.03 * hats);
  }
}

// --- Score (frames are the film's) ----------------------------------------------------------

// 1 · Tokens (0–600): one tick per token emitted; the run speeds into a shimmer, then stops dead.
{
  const emitted = (f) => {
    if (f < 24) return 0;
    if (f < 144) return Math.floor((f - 24) / 15) + 1;
    const u = f - 144;
    return Math.min(67 * 16, 8 + Math.floor(0.25 * u + 0.000546 * u ** 2.6)); // as src/scenes/tokens.tsx
  };
  let prev = 0;
  for (let f = 0; f < 412; f++) {
    const n = emitted(f);
    const fresh = n - prev;
    prev = n;
    if (fresh <= 0) continue;
    const g = 0.11 / Math.sqrt(Math.max(1, fresh / 2));
    tick(at(f), PENTA[Math.floor(rand() * PENTA.length)], g, rand() * 1.2 - 0.6);
    if (fresh > 6)
      tick(at(f) + 0.008, PENTA[Math.floor(rand() * PENTA.length)], g * 0.7, rand() * 1.2 - 0.6);
  }
  // Under the spinner: nothing but one low, held note.
  pad(at(452), 2.4, 38, 0.03);
}

// 2 · The glyph (600–1080): the pulse starts on the cut. Ember at 810, done at 990.
groove(600, 1080, { pulse: 1, pads: 0.8, sub: 0.6 });
ember(at(810));
pluck(at(990), 86, 0.09, 0, 0.6);

// 3 · The run (1080–1920): full groove; it thins out while the run waits on a person,
// drops to the pad as the person reaches for the key, and comes back on the press.
groove(1080, 1560, { pulse: 1, kicks: 1, hats: 1, pads: 1, sub: 1 });
for (let k = 0; k < 6; k++) tick(at(1080 + 60 + k * 15), 88 + (k % 3) * 2, 0.06, 0.4);
ember(at(1560));
groove(1560, 1680, { pulse: 0.6, kicks: 0, hats: 0.6, pads: 1, sub: 0.6 });
groove(1680, 1800, { pulse: 0, pads: 0.9, sub: 0 });
key(at(1788));
kick(at(1800), 0.5);
groove(1800, 1920, { pulse: 1, kicks: 1, hats: 1, pads: 1, sub: 1 });
for (let k = 0; k < 6; k++) tick(at(1800 + k * 15), 86 + (k % 3) * 2, 0.05, 0.4);

// 4 · Agent-ready (1920–2520): lighter; a tick per line the agent prints, a key per press,
// ember when its press stops for a person, then only the pad while it waits.
groove(1920, 2328, { pulse: 0.85, kicks: 0.6, hats: 0.8, pads: 1, sub: 0.8 });
groove(2328, 2520, { pulse: 0.4, kicks: 0, hats: 0, pads: 1, sub: 0.5 });
for (const f of [84, 112, 124, 136, 148, 196, 256, 282, 338, 364])
  tick(at(1920 + f), 90, 0.05, -0.3);
for (const f of [248, 330, 408]) key(at(1920 + f), 0.26);
ember(at(1920 + 412));

// 5 · Install (2520–2880): the pulse returns; a tick per file written, per way in.
groove(2520, 2880, { pulse: 1, kicks: 0.7, hats: 1, pads: 1, sub: 0.9 });
for (let k = 0; k < 9; k++) tick(at(2520 + 128 + k * 8), 88 + (k % 4), 0.05, 0.3);
for (let k = 0; k < 4; k++) tick(at(2520 + 214 + k * 12), 81 + k * 2, 0.07, -0.2);

// 6 · End (2880–3300): silence and one tick for the dot; the walls close on a low thump and
// the first chord rings out under the name.
tick(at(2880), 86, 0.1);
kick(at(2880 + 84), 0.55);
bass(at(2880 + 84), 38 + 12, 3.2, 0.22);
for (const m of [62, 66, 69, 73, 76]) pad(at(2880 + 84), 6.2, m, 0.03);
for (const [k, m] of [74, 78, 81, 85].entries())
  pluck(at(2880 + 166 + k * 7.5), m, 0.06, k % 2 ? 0.3 : -0.3, 0.5);

// --- Master --------------------------------------------------------------------------------

// A gentle room: two short, quiet, cross-fed echoes, so the plucks have somewhere to land.
for (const [d, g] of [
  [0.187, 0.16],
  [0.375, 0.08],
]) {
  const k = Math.round(d * SR);
  for (let i = N - 1; i >= k; i--) {
    L[i] += R[i - k] * g;
    R[i] += L[i - k] * g;
  }
}
let peak = 0;
for (let i = 0; i < N; i++) {
  L[i] = Math.tanh(L[i] * 1.1);
  R[i] = Math.tanh(R[i] * 1.1);
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const norm = 0.89 / peak; // about -1 dBFS
// Fade the last second.
const fadeFrom = N - SR;
const out = Buffer.alloc(44 + N * 4);
out.write("RIFF", 0);
out.writeUInt32LE(36 + N * 4, 4);
out.write("WAVEfmt ", 8);
out.writeUInt32LE(16, 16);
out.writeUInt16LE(1, 20);
out.writeUInt16LE(2, 22);
out.writeUInt32LE(SR, 24);
out.writeUInt32LE(SR * 4, 28);
out.writeUInt16LE(4, 32);
out.writeUInt16LE(16, 34);
out.write("data", 36);
out.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const f = i > fadeFrom ? 1 - (i - fadeFrom) / SR : 1;
  out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * norm * f)) * 32767), 44 + i * 4);
  out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * norm * f)) * 32767), 46 + i * 4);
}
const file = path.join(process.cwd(), "public/audio/kura-launch.wav");
mkdirSync(path.dirname(file), { recursive: true });
writeFileSync(file, out);
console.log(`wrote ${file} (${SECONDS}s, peak normalised from ${peak.toFixed(2)})`);
