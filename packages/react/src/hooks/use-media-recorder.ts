import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

export type MediaRecorderStatus =
  | "idle"
  /** Waiting for the permission prompt. */
  | "requesting"
  | "recording"
  | "paused"
  /** Finished; `blob` holds the recording. */
  | "stopped"
  /** The user or browser denied mic/camera access. */
  | "denied"
  /** No MediaRecorder or getUserMedia (SSR, old browsers, insecure origin, jsdom). */
  | "unsupported"
  | "error";

export interface UseMediaRecorderOptions {
  /** Passed to getUserMedia. Default `{ audio: true }`. */
  constraints?: MediaStreamConstraints;
  /** Preferred mime type; falls back to the first supported of webm/opus, mp4, ogg. */
  mimeType?: string;
  /** Emit chunks every N ms (for streaming upload). Default: one chunk on stop. */
  timeslice?: number;
  onDataAvailable?: (chunk: Blob) => void;
  onStop?: (blob: Blob) => void;
  onError?: (error: Error) => void;
}

export interface MediaRecorderControls {
  status: MediaRecorderStatus;
  isSupported: boolean;
  isRecording: boolean;
  /** Live stream while recording — feed it to `useAudioAnalyser({ source: stream })`. */
  stream: MediaStream | null;
  /** Final recording after `stop()`. */
  blob: Blob | null;
  mimeType: string | null;
  error: Error | null;
  /** Elapsed recording time in ms (excludes paused time). Updates ~4×/s. */
  durationMs: number;
  /** Ask for permission and start. Resolves with the stream, or null on failure/unsupported. */
  start: () => Promise<MediaStream | null>;
  /** Stop and resolve with the final blob (null if nothing was recording). */
  stop: () => Promise<Blob | null>;
  pause: () => void;
  resume: () => void;
  /** Stop tracks and clear blob/error, back to "idle". */
  reset: () => void;
}

const noopSubscribe = () => () => {};

function detectSupport(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.MediaRecorder !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

function pickMimeType(preferred?: string): string | undefined {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
    return preferred;
  }
  const candidates = [
    preferred,
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  return candidates.find((t): t is string => !!t && MediaRecorder.isTypeSupported(t));
}

function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

/**
 * Record audio (or video) with MediaRecorder, with explicit states for permission, denial and
 * unsupported environments. SSR-safe: `isSupported` is false on the server and hydrates.
 */
export function useMediaRecorder(options: UseMediaRecorderOptions = {}): MediaRecorderControls {
  const optsRef = useRef(options);
  optsRef.current = options;
  const isSupported = useSyncExternalStore(noopSubscribe, detectSupport, () => false);

  const [status, setStatus] = useState<MediaRecorderStatus>("idle");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [durationMs, setDurationMs] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopResolvers = useRef<Array<(blob: Blob | null) => void>>([]);
  const clock = useRef({ startedAt: 0, accumulated: 0 });

  const stopTracks = useCallback(() => {
    for (const track of streamRef.current?.getTracks() ?? []) track.stop();
    streamRef.current = null;
    setStream(null);
  }, []);

  const fail = useCallback((err: unknown, next: MediaRecorderStatus = "error") => {
    const e = toError(err);
    setError(e);
    setStatus(next);
    optsRef.current.onError?.(e);
  }, []);

  const start = useCallback(async (): Promise<MediaStream | null> => {
    if (!detectSupport()) {
      setStatus("unsupported");
      return null;
    }
    if (recorderRef.current && recorderRef.current.state !== "inactive") return streamRef.current;
    setStatus("requesting");
    setError(null);
    setBlob(null);
    let media: MediaStream;
    try {
      media = await navigator.mediaDevices.getUserMedia(
        optsRef.current.constraints ?? { audio: true },
      );
    } catch (err) {
      const name = (err as { name?: string })?.name;
      fail(err, name === "NotAllowedError" || name === "SecurityError" ? "denied" : "error");
      return null;
    }
    try {
      const type = pickMimeType(optsRef.current.mimeType);
      const recorder = new MediaRecorder(media, type ? { mimeType: type } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
          optsRef.current.onDataAvailable?.(event.data);
        }
      };
      recorder.onstop = () => {
        const out = new Blob(chunksRef.current, { type: recorder.mimeType || type || "" });
        setBlob(out);
        setStatus("stopped");
        optsRef.current.onStop?.(out);
        for (const resolve of stopResolvers.current) resolve(out);
        stopResolvers.current = [];
        stopTracks();
      };
      recorder.onerror = (event) => fail((event as unknown as { error?: unknown }).error ?? event);
      recorderRef.current = recorder;
      streamRef.current = media;
      setStream(media);
      setMimeType(recorder.mimeType || type || null);
      clock.current = { startedAt: performance.now(), accumulated: 0 };
      setDurationMs(0);
      recorder.start(optsRef.current.timeslice);
      setStatus("recording");
      return media;
    } catch (err) {
      for (const track of media.getTracks()) track.stop();
      fail(err);
      return null;
    }
  }, [fail, stopTracks]);

  const stop = useCallback((): Promise<Blob | null> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return Promise.resolve(null);
    return new Promise((resolve) => {
      stopResolvers.current.push(resolve);
      recorder.stop();
    });
  }, []);

  const pause = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder?.state !== "recording") return;
    recorder.pause();
    clock.current.accumulated += performance.now() - clock.current.startedAt;
    setStatus("paused");
  }, []);

  const resume = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder?.state !== "paused") return;
    recorder.resume();
    clock.current.startedAt = performance.now();
    setStatus("recording");
  }, []);

  const reset = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.stop();
    }
    recorderRef.current = null;
    stopTracks();
    setBlob(null);
    setError(null);
    setDurationMs(0);
    setStatus("idle");
  }, [stopTracks]);

  useEffect(() => {
    if (status !== "recording") return;
    const id = setInterval(() => {
      setDurationMs(clock.current.accumulated + performance.now() - clock.current.startedAt);
    }, 250);
    return () => clearInterval(id);
  }, [status]);

  // Release the mic on unmount.
  useEffect(
    () => () => {
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = null;
        recorder.stop();
      }
      for (const track of streamRef.current?.getTracks() ?? []) track.stop();
    },
    [],
  );

  return {
    status: isSupported || status !== "idle" ? status : "unsupported",
    isSupported,
    isRecording: status === "recording",
    stream,
    blob,
    mimeType,
    error,
    durationMs,
    start,
    stop,
    pause,
    resume,
    reset,
  };
}
