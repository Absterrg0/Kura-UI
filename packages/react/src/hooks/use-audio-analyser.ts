import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** One analysed audio frame. All arrays are reused between frames — copy them if you keep them. */
export interface AudioFrame {
  /** Smoothed loudness 0..1 (RMS, perceptually scaled). Drive scale/opacity with this. */
  level: number;
  /** Instant peak 0..1 of the current frame. */
  peak: number;
  /** `bands` values 0..1, log-spaced from ~60 Hz to ~8 kHz. Drive bars/orbs with this. */
  bands: Float32Array;
  /** Time-domain samples -1..1. Drive oscilloscope-style waveforms with this. */
  waveform: Float32Array;
  /** `performance.now()` at analysis time (ms). */
  time: number;
}

export type AudioAnalyserStatus =
  /** No source yet (or disabled). Frames are silent. */
  | "idle"
  /** Analysing a real MediaStream / media element. */
  | "running"
  /** Generating synthetic data (demos, tests, SSR previews, permission denied fallbacks). */
  | "simulated"
  /** Web Audio is not available (SSR, old browsers, jsdom). Frames are silent. */
  | "unsupported"
  | "error";

export type AudioSimulation = "speech" | "music" | "silence";

export interface UseAudioAnalyserOptions {
  /** Mic/WebRTC stream or an <audio>/<video> element. `null`/`undefined` → idle. */
  source?: MediaStream | HTMLMediaElement | null;
  /**
   * Generate realistic synthetic data instead of reading `source`. `true` = "speech".
   * Use for docs, previews, Storybook, tests and "before permission" states.
   */
  simulate?: boolean | AudioSimulation;
  /** Number of frequency bands in `frame.bands`. Default 32. */
  bands?: number;
  /** AnalyserNode FFT size (power of two, 32–32768). Default 1024. */
  fftSize?: number;
  /** AnalyserNode smoothing 0..1. Default 0.8. */
  smoothing?: number;
  /** Lower bound of the dB range mapped to 0. Default -90. */
  minDecibels?: number;
  /** Upper bound of the dB range mapped to 1. Default -10. */
  maxDecibels?: number;
  /** Set false to stop analysing without unmounting. Default true. */
  enabled?: boolean;
}

export interface AudioAnalyser {
  status: AudioAnalyserStatus;
  error: Error | null;
  /** Analyse and return the current frame. Cheap; safe to call inside requestAnimationFrame. */
  read: () => AudioFrame;
  /** Called once per animation frame while subscribed. Returns an unsubscribe function. */
  subscribe: (listener: (frame: AudioFrame) => void) => () => void;
}

type AudioContextCtor = typeof AudioContext;

function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

// A media element can only be wired to one MediaElementAudioSourceNode, ever. Cache it.
const elementSources = new WeakMap<
  HTMLMediaElement,
  { context: AudioContext; node: MediaElementAudioSourceNode }
>();

/** Deterministic hash noise in [0, 1). */
function noise(x: number): number {
  const s = Math.sin(x * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/** Smooth value noise in [0, 1). */
function smoothNoise(x: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return noise(i) * (1 - u) + noise(i + 1) * u;
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

/** Simulated level envelope 0..1 for time `t` in seconds. */
function simulatedLevel(kind: AudioSimulation, t: number): number {
  if (kind === "silence") return 0.02 * smoothNoise(t * 3);
  if (kind === "music") {
    const beat = Math.max(0, Math.sin(t * Math.PI * 2 * 2)) ** 6; // 120 bpm
    return clamp01(0.45 + 0.2 * smoothNoise(t * 1.3) + 0.35 * beat);
  }
  // speech: syllables (~4 Hz) inside phrases (~0.4 Hz) with pauses between phrases
  const phrase = smoothNoise(t * 0.45);
  const gate = phrase > 0.32 ? 1 : 0.08;
  const syllable = 0.55 + 0.45 * Math.sin(t * Math.PI * 2 * 4.2 + 2 * smoothNoise(t * 2));
  return clamp01(gate * syllable * (0.55 + 0.45 * smoothNoise(t * 7)));
}

/**
 * Real-time audio analysis via Web Audio for a mic `MediaStream` or an `<audio>`/`<video>`
 * element, with a deterministic simulated mode for demos and tests. SSR-safe.
 *
 * Per-frame data is NOT React state (that would re-render 60×/s). Read it imperatively:
 *
 *   const analyser = useAudioAnalyser({ source: stream, bands: 24 });
 *   useEffect(() => analyser.subscribe((f) => { el.style.scale = String(1 + f.level) }), [analyser]);
 *
 * Or, for low-frequency React rendering, use `useAudioFrame(analyser, { fps: 30 })`.
 */
export function useAudioAnalyser(options: UseAudioAnalyserOptions = {}): AudioAnalyser {
  const {
    source = null,
    simulate = false,
    bands = 32,
    fftSize = 1024,
    smoothing = 0.8,
    minDecibels = -90,
    maxDecibels = -10,
    enabled = true,
  } = options;
  const simulation: AudioSimulation | null =
    simulate === true ? "speech" : simulate === false ? null : simulate;

  const [status, setStatus] = useState<AudioAnalyserStatus>(simulation ? "simulated" : "idle");
  const [error, setError] = useState<Error | null>(null);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const freqRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const timeRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const simRef = useRef(simulation);
  simRef.current = enabled ? simulation : null;
  const smoothedLevel = useRef(0);

  const frame = useMemo<AudioFrame>(
    () => ({
      level: 0,
      peak: 0,
      bands: new Float32Array(bands),
      waveform: new Float32Array(fftSize),
      time: 0,
    }),
    [bands, fftSize],
  );

  // Wire up the Web Audio graph for real sources.
  useEffect(() => {
    if (!enabled || simulation || !source) {
      analyserRef.current = null;
      setStatus(simulation && enabled ? "simulated" : "idle");
      return;
    }
    const Ctor = getAudioContextCtor();
    if (!Ctor) {
      setStatus("unsupported");
      return;
    }
    let context: AudioContext;
    let input: AudioNode;
    let ownsContext = true;
    const cleanups: Array<() => void> = [];
    try {
      if (typeof MediaStream !== "undefined" && source instanceof MediaStream) {
        context = new Ctor();
        input = context.createMediaStreamSource(source);
      } else {
        const element = source as HTMLMediaElement;
        let cached = elementSources.get(element);
        if (!cached) {
          const ctx = new Ctor();
          const node = ctx.createMediaElementSource(element);
          node.connect(ctx.destination); // keep the element audible
          cached = { context: ctx, node };
          elementSources.set(element, cached);
        }
        context = cached.context;
        input = cached.node;
        ownsContext = false;
        const resume = () => void context.resume().catch(() => {});
        element.addEventListener("play", resume);
        cleanups.push(() => element.removeEventListener("play", resume));
      }
      const analyser = context.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = smoothing;
      analyser.minDecibels = minDecibels;
      analyser.maxDecibels = maxDecibels;
      input.connect(analyser); // never connect a mic to destination (feedback)
      analyserRef.current = analyser;
      freqRef.current = new Uint8Array(analyser.frequencyBinCount);
      timeRef.current = new Float32Array(analyser.fftSize);
      void context.resume().catch(() => {});
      setStatus("running");
      setError(null);
      cleanups.push(() => {
        input.disconnect(analyser);
        if (ownsContext) void context.close().catch(() => {});
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setStatus("error");
    }
    return () => {
      analyserRef.current = null;
      for (const fn of cleanups) fn();
    };
  }, [source, simulation, enabled, fftSize, smoothing, minDecibels, maxDecibels]);

  const read = useCallback((): AudioFrame => {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    frame.time = now;
    const sim = simRef.current;
    const analyser = analyserRef.current;
    const n = frame.bands.length;

    if (sim) {
      const t = now / 1000;
      const level = simulatedLevel(sim, t);
      for (let i = 0; i < n; i++) {
        const x = i / Math.max(1, n - 1);
        // spectral tilt: speech energy concentrates low-mid, music spreads wider
        const tilt = sim === "music" ? 1 - x * 0.6 : Math.exp(-((x - 0.22) ** 2) / 0.08);
        const jitter = 0.6 + 0.4 * smoothNoise(t * 9 + i * 1.7);
        frame.bands[i] = clamp01(level * tilt * jitter * 1.15);
      }
      const len = frame.waveform.length;
      for (let i = 0; i < len; i++) {
        const p = i / len;
        frame.waveform[i] =
          level *
          (0.6 * Math.sin(p * Math.PI * 2 * 3 + t * 9) +
            0.3 * Math.sin(p * Math.PI * 2 * 7 + t * 13) +
            0.1 * (noise(i + t) * 2 - 1));
      }
      frame.peak = level;
      smoothedLevel.current += (level - smoothedLevel.current) * 0.35;
      frame.level = smoothedLevel.current;
      return frame;
    }

    if (!analyser || !freqRef.current || !timeRef.current) {
      frame.bands.fill(0);
      frame.waveform.fill(0);
      frame.level = 0;
      frame.peak = 0;
      smoothedLevel.current = 0;
      return frame;
    }

    const freq = freqRef.current;
    const td = timeRef.current;
    analyser.getByteFrequencyData(freq);
    analyser.getFloatTimeDomainData(td);

    // log-spaced bands between ~60 Hz and ~8 kHz
    const sampleRate = analyser.context.sampleRate;
    const binHz = sampleRate / analyser.fftSize;
    const minHz = 60;
    const maxHz = Math.min(8000, sampleRate / 2);
    for (let i = 0; i < n; i++) {
      const lo = minHz * (maxHz / minHz) ** (i / n);
      const hi = minHz * (maxHz / minHz) ** ((i + 1) / n);
      const a = Math.max(0, Math.floor(lo / binHz));
      const b = Math.min(freq.length - 1, Math.max(a, Math.ceil(hi / binHz)));
      let sum = 0;
      for (let k = a; k <= b; k++) sum += freq[k] ?? 0;
      frame.bands[i] = sum / ((b - a + 1) * 255);
    }

    let sumSq = 0;
    let peak = 0;
    const wlen = frame.waveform.length;
    for (let i = 0; i < td.length; i++) {
      const v = td[i] ?? 0;
      sumSq += v * v;
      const abs = Math.abs(v);
      if (abs > peak) peak = abs;
      if (i < wlen) frame.waveform[i] = v;
    }
    const rms = Math.sqrt(sumSq / td.length);
    // perceptual scaling: speech RMS sits around 0.02–0.3
    const level = clamp01(Math.sqrt(rms) * 1.6);
    smoothedLevel.current += (level - smoothedLevel.current) * 0.3;
    frame.level = smoothedLevel.current;
    frame.peak = clamp01(peak);
    return frame;
  }, [frame]);

  // Shared rAF loop that only runs while someone is subscribed.
  const listeners = useRef(new Set<(frame: AudioFrame) => void>());
  const rafRef = useRef<number | null>(null);
  const tick = useCallback(() => {
    const f = read();
    for (const l of listeners.current) l(f);
    rafRef.current = requestAnimationFrame(tick);
  }, [read]);

  const subscribe = useCallback(
    (listener: (frame: AudioFrame) => void) => {
      listeners.current.add(listener);
      if (rafRef.current === null && typeof requestAnimationFrame !== "undefined") {
        rafRef.current = requestAnimationFrame(tick);
      }
      return () => {
        listeners.current.delete(listener);
        if (listeners.current.size === 0 && rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      };
    },
    [tick],
  );

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    },
    [],
  );

  return useMemo(() => ({ status, error, read, subscribe }), [status, error, read, subscribe]);
}

export interface UseAudioFrameOptions {
  /** Max React updates per second. Default 30. */
  fps?: number;
}

/** A snapshot of the analyser as React state, throttled to `fps`. Copies the arrays. */
export interface AudioFrameSnapshot {
  level: number;
  peak: number;
  bands: number[];
  waveform: number[];
}

/**
 * Render audio data with plain React (e.g. 24 bars). Throttled, so it is fine for small DOM
 * visualisations. For canvas/WebGL use `analyser.subscribe` instead.
 */
export function useAudioFrame(
  analyser: AudioAnalyser,
  { fps = 30 }: UseAudioFrameOptions = {},
): AudioFrameSnapshot {
  const [snapshot, setSnapshot] = useState<AudioFrameSnapshot>(() => ({
    level: 0,
    peak: 0,
    bands: [],
    waveform: [],
  }));
  useEffect(() => {
    let last = 0;
    const interval = 1000 / fps;
    return analyser.subscribe((f) => {
      if (f.time - last < interval) return;
      last = f.time;
      setSnapshot({
        level: f.level,
        peak: f.peak,
        bands: Array.from(f.bands),
        waveform: Array.from(f.waveform),
      });
    });
  }, [analyser, fps]);
  return snapshot;
}
