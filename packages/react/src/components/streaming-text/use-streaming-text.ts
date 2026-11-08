"use client";

import * as React from "react";

export interface UseStreamingTextOptions {
  /** The text received so far. Pass a growing string; a non-append change restarts the reveal. */
  text?: string;
  /** An async iterable of chunks (e.g. tokens from `fetch` or the AI SDK). Takes precedence over `text`. */
  stream?: AsyncIterable<string> | null;
  /**
   * Minimum reveal cadence in characters per second. Bursty input is buffered and released at
   * this rate (faster when a backlog builds up, so the reveal never trails by more than ~½s).
   * `0` disables smoothing: text appears exactly as it arrives. Default 90.
   */
  speed?: number;
  /** More text is still coming. Defaults to true while `stream` is being read, otherwise false. */
  streaming?: boolean;
  /** Called once when the stream has ended and every character has been revealed. */
  onComplete?: () => void;
}

export interface StreamingChunk {
  id: number;
  text: string;
}

export interface UseStreamingTextResult {
  /** Everything received so far (not yet necessarily revealed). */
  text: string;
  /** The revealed text: `settled + chunks.join("")`. */
  displayed: string;
  /** Revealed text whose enter animation has finished; render it as one plain text node. */
  settled: string;
  /** Recently revealed chunks, still animating in. Render each one in its own element. */
  chunks: StreamingChunk[];
  /** True while more text is expected or the reveal is still catching up. */
  isStreaming: boolean;
}

/** How long a chunk keeps its own element before it is merged into the settled text node. */
const SETTLE_MS = 700;
/** Minimum time between two revealed chunks — groups characters into words, not letters. */
const CADENCE_MS = 45;
/** Extra characters/second per character of backlog, so the reveal drains a burst in ~⅓s. */
const CATCH_UP = 3;

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
const raf = (cb: (t: number) => void): number =>
  typeof requestAnimationFrame === "function"
    ? requestAnimationFrame(cb)
    : (setTimeout(() => cb(now()), 16) as unknown as number);
const caf = (id: number) =>
  typeof cancelAnimationFrame === "function" ? cancelAnimationFrame(id) : clearTimeout(id);

interface StreamReader {
  text: string;
  done: boolean;
  subscribe: (listener: () => void) => () => void;
}

/**
 * One reader per iterable: an async iterator can only be consumed once, so effects that re-run
 * (React StrictMode, remounts) share it. The iterator is closed shortly after the last
 * subscriber leaves, which lets StrictMode's unmount/remount keep reading.
 */
const readers = new WeakMap<AsyncIterable<string>, StreamReader>();

function readerFor(stream: AsyncIterable<string>): StreamReader {
  const existing = readers.get(stream);
  if (existing) return existing;
  const iterator = stream[Symbol.asyncIterator]();
  const listeners = new Set<() => void>();
  let stopTimer: ReturnType<typeof setTimeout> | undefined;
  const notify = () => {
    for (const l of listeners) l();
  };
  const reader: StreamReader = {
    text: "",
    done: false,
    subscribe(listener) {
      clearTimeout(stopTimer);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && !reader.done) {
          stopTimer = setTimeout(() => {
            reader.done = true;
            void iterator.return?.();
          }, 50);
        }
      };
    },
  };
  readers.set(stream, reader);
  (async () => {
    try {
      while (!reader.done) {
        const { value, done } = await iterator.next();
        if (done || reader.done) break;
        reader.text += value;
        notify();
      }
    } catch {
      // A failed stream simply ends; the consumer surfaces the error state.
    }
    reader.done = true;
    notify();
  })();
  return reader;
}

/**
 * Turns a growing string or an async iterable into a calm, evenly paced reveal. Returns the
 * revealed text split into a settled prefix and a few still-animating chunks (word groups),
 * so a renderer can fade only the newest words in without creating thousands of elements.
 */
export function useStreamingText({
  text,
  stream,
  speed = 90,
  streaming,
  onComplete,
}: UseStreamingTextOptions = {}): UseStreamingTextResult {
  // --- source: a prop string or an async iterable ---------------------------------------------
  const [streamed, setStreamed] = React.useState({ text: "", done: !stream });

  React.useEffect(() => {
    if (!stream) return;
    const reader = readerFor(stream);
    const sync = () => setStreamed({ text: reader.text, done: reader.done });
    sync();
    return reader.subscribe(sync);
  }, [stream]);

  const reading = !!stream && !streamed.done;
  const source = stream ? streamed.text : (text ?? "");
  const more = streaming ?? (stream ? reading : false);

  // --- reveal ----------------------------------------------------------------------------------
  // Text present at mount is shown immediately (no replay on remount or hydration).
  const initial = stream ? "" : source;
  const [state, setState] = React.useState<{ settled: string; chunks: StreamingChunk[] }>({
    settled: initial,
    chunks: [],
  });
  const shown = React.useRef(initial.length);
  const sourceRef = React.useRef(source);
  sourceRef.current = source;
  const chunkTimes = React.useRef(new Map<number, number>());
  const nextId = React.useRef(0);
  const [revealing, setRevealing] = React.useState(false);

  const settle = React.useCallback((all: boolean) => {
    const t = now();
    setState((s) => {
      let i = 0;
      while (
        i < s.chunks.length &&
        (all || t - (chunkTimes.current.get(s.chunks[i]!.id) ?? 0) >= SETTLE_MS)
      )
        i++;
      if (i === 0) return s;
      for (const c of s.chunks.slice(0, i)) chunkTimes.current.delete(c.id);
      return {
        settled:
          s.settled +
          s.chunks
            .slice(0, i)
            .map((c) => c.text)
            .join(""),
        chunks: s.chunks.slice(i),
      };
    });
  }, []);

  const revealed = React.useRef(initial);
  const emit = React.useCallback(
    (piece: string) => {
      revealed.current += piece;
      const id = nextId.current++;
      chunkTimes.current.set(id, now());
      setState((s) => ({ settled: s.settled, chunks: [...s.chunks, { id, text: piece }] }));
      settle(false);
    },
    [settle],
  );

  const speedRef = React.useRef(speed);
  speedRef.current = speed;
  const loop = React.useRef({ frame: 0, running: false, last: 0, lastEmit: 0, budget: 0 });

  const tick = React.useCallback(
    (t: number) => {
      const l = loop.current;
      const target = sourceRef.current;
      const dt = Math.max(0, Math.min(0.1, (t - l.last) / 1000));
      l.last = t;
      const backlog = target.length - shown.current;
      l.budget += (speedRef.current + backlog * CATCH_UP) * dt;
      if (t - l.lastEmit >= CADENCE_MS && l.budget >= 1) {
        let end = Math.min(target.length, shown.current + Math.floor(l.budget));
        // Finish the current word so chunks are word groups, never broken letters.
        const rest = target.slice(end);
        const ws = rest.search(/\s/);
        if (ws > 0 && ws <= 12) end += ws;
        else if (ws < 0 && rest.length <= 12) end = target.length;
        l.budget = Math.max(0, l.budget - (end - shown.current));
        emit(target.slice(shown.current, end));
        shown.current = end;
        l.lastEmit = t;
      }
      if (shown.current < target.length) {
        l.frame = raf(tick);
      } else {
        l.running = false;
        l.budget = 0;
        setRevealing(false);
      }
    },
    [emit],
  );

  React.useEffect(() => {
    const displayed = revealed.current;
    // Non-append change (new message, regenerate): restart from the common prefix.
    if (!source.startsWith(displayed)) {
      let common = 0;
      while (common < source.length && source[common] === displayed[common]) common++;
      shown.current = common;
      revealed.current = source.slice(0, common);
      chunkTimes.current.clear();
      setState({ settled: source.slice(0, common), chunks: [] });
    }
    if (shown.current >= source.length) return;
    if (speed <= 0) {
      emit(source.slice(shown.current));
      shown.current = source.length;
      return;
    }
    const l = loop.current;
    if (l.running) return;
    l.running = true;
    l.last = now();
    setRevealing(true);
    l.frame = raf(tick);
  }, [source, speed, emit, tick]);

  React.useEffect(
    () => () => {
      caf(loop.current.frame);
      loop.current.running = false;
    },
    [],
  );

  // Merge the last chunks into the settled node once their animation has finished.
  React.useEffect(() => {
    if (revealing || state.chunks.length === 0) return;
    const id = setTimeout(() => settle(true), SETTLE_MS);
    return () => clearTimeout(id);
  }, [revealing, state.chunks.length, settle]);

  // --- completion ------------------------------------------------------------------------------
  const displayed = state.settled + state.chunks.map((c) => c.text).join("");
  // Derived from the render, not the loop state, so a stream that ends in the same tick as its
  // last token does not flip to "done" before the reveal has started.
  const isStreaming = more || revealing || displayed !== source;
  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;
  const wasStreaming = React.useRef(isStreaming);
  React.useEffect(() => {
    if (wasStreaming.current && !isStreaming) onCompleteRef.current?.();
    wasStreaming.current = isStreaming;
  }, [isStreaming]);

  return { text: source, displayed, settled: state.settled, chunks: state.chunks, isStreaming };
}
