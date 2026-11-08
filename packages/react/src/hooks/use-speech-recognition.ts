import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

export type SpeechRecognitionStatus =
  | "idle"
  | "listening"
  /** Mic permission denied or the service is not allowed. */
  | "denied"
  /** No Web Speech API (Firefox, SSR, jsdom). Fall back to recording + server transcription. */
  | "unsupported"
  | "error";

export interface SpeechRecognitionResultChunk {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

export interface UseSpeechRecognitionOptions {
  /** BCP-47 language tag. Default: the document language or browser default. */
  lang?: string;
  /** Keep listening across pauses. Default true. */
  continuous?: boolean;
  /** Emit partial results while speaking. Default true. */
  interimResults?: boolean;
  onResult?: (result: SpeechRecognitionResultChunk) => void;
  onEnd?: (finalTranscript: string) => void;
  onError?: (error: Error) => void;
}

export interface SpeechRecognitionControls {
  status: SpeechRecognitionStatus;
  isSupported: boolean;
  isListening: boolean;
  /** finalTranscript + interimTranscript — what to show in the input. */
  transcript: string;
  finalTranscript: string;
  interimTranscript: string;
  error: Error | null;
  start: () => void;
  /** Stop and finalise pending results. */
  stop: () => void;
  /** Stop and discard pending results. */
  abort: () => void;
  /** Clear transcripts and errors. */
  reset: () => void;
}

// Minimal Web Speech API typings (not in lib.dom).
interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechRecognitionResultLike };
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string; message?: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noopSubscribe = () => () => {};

/**
 * Browser speech-to-text (Web Speech API) with interim results and graceful fallback.
 * When `isSupported` is false, record with `useMediaRecorder` and transcribe on your server.
 */
export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {},
): SpeechRecognitionControls {
  const optsRef = useRef(options);
  optsRef.current = options;
  const isSupported = useSyncExternalStore(
    noopSubscribe,
    () => getCtor() !== null,
    () => false,
  );

  const [status, setStatus] = useState<SpeechRecognitionStatus>("idle");
  const [finalTranscript, setFinal] = useState("");
  const [interimTranscript, setInterim] = useState("");
  const [error, setError] = useState<Error | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef("");

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) {
      setStatus("unsupported");
      return;
    }
    if (recognitionRef.current) return;
    const { lang, continuous = true, interimResults = true } = optsRef.current;
    const recognition = new Ctor();
    recognition.lang =
      lang ?? (typeof document !== "undefined" ? document.documentElement.lang : "") ?? "";
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.onstart = () => setStatus("listening");
    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const alt = result?.[0];
        if (!result || !alt) continue;
        if (result.isFinal) {
          finalRef.current += alt.transcript;
          setFinal(finalRef.current);
        } else {
          interim += alt.transcript;
        }
        optsRef.current.onResult?.({
          transcript: alt.transcript,
          isFinal: result.isFinal,
          confidence: alt.confidence,
        });
      }
      setInterim(interim);
    };
    recognition.onerror = (event) => {
      const e = new Error(event.message || event.error);
      e.name = event.error;
      setError(e);
      setStatus(
        event.error === "not-allowed" || event.error === "service-not-allowed" ? "denied" : "error",
      );
      optsRef.current.onError?.(e);
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setInterim("");
      setStatus((s) => (s === "listening" ? "idle" : s));
      optsRef.current.onEnd?.(finalRef.current);
    };
    recognitionRef.current = recognition;
    setError(null);
    setStatus("listening");
    try {
      recognition.start();
    } catch (err) {
      recognitionRef.current = null;
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      setStatus("error");
    }
  }, []);

  const stop = useCallback(() => recognitionRef.current?.stop(), []);
  const abort = useCallback(() => {
    recognitionRef.current?.abort();
    setInterim("");
  }, []);
  const reset = useCallback(() => {
    finalRef.current = "";
    setFinal("");
    setInterim("");
    setError(null);
  }, []);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  const effectiveStatus = !isSupported && status === "idle" ? "unsupported" : status;
  return {
    status: effectiveStatus,
    isSupported,
    isListening: status === "listening",
    transcript: finalTranscript + interimTranscript,
    finalTranscript,
    interimTranscript,
    error,
    start,
    stop,
    abort,
    reset,
  };
}
