"use client";

import { Mic, MicOff, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import { useAudioAnalyser } from "../../hooks/use-audio-analyser";
import { useHotkey } from "../../hooks/use-hotkey";
import { useMediaRecorder } from "../../hooks/use-media-recorder";
import { useReducedMotion } from "../../hooks/use-reduced-motion";
import { useSpeechRecognition } from "../../hooks/use-speech-recognition";
import { cn } from "../../lib/cn";
import type { KeyName } from "../../lib/keys";
import { springs } from "../../lib/motion";
import { AudioWaveform } from "../audio-waveform";
import { ShimmerText } from "../shimmer-text";
import { Spinner } from "../spinner";
import { Tooltip } from "../tooltip";

export type VoiceDictationStatus =
  | "idle"
  | "requesting"
  | "listening"
  | "processing"
  | "denied"
  | "unsupported"
  | "error";

export interface VoiceDictationProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** Called once per dictation with the final, trimmed text (not called when cancelled or empty). */
  onTranscript?: (text: string) => void;
  /** Live transcript while listening (final + interim), e.g. to preview in a field. */
  onInterim?: (text: string) => void;
  onStatusChange?: (status: VoiceDictationStatus) => void;
  /** `toggle` = click to start and stop. `hold` = press and hold (pointer, Space/Enter or the hotkey). Default "toggle". */
  mode?: "toggle" | "hold";
  /** Global shortcut. Default ["mod", "shift", "d"]. Pass null to disable. */
  hotkey?: readonly KeyName[] | null;
  /** BCP-47 language for speech recognition, e.g. "en-US". Default: the page language. */
  lang?: string;
  /**
   * Fallback when the browser has no Web Speech API: the recording is passed here and the
   * returned text is used (status "processing" meanwhile). E.g. post to a Whisper endpoint.
   */
  transcribe?: (audio: Blob) => Promise<string>;
  /**
   * Demo mode: fake permission, a simulated waveform and a scripted transcript. `true` uses a
   * built-in script; a string is typed out word by word.
   */
  simulate?: boolean | string;
  /** Show the live transcript card under the control. Default true. */
  showTranscript?: boolean;
  /** Placeholder in the transcript card before any words arrive. Default "Listening…". */
  transcriptPlaceholder?: string;
  disabled?: boolean;
}

const DEFAULT_SCRIPT =
  "Draft a short note to the team: the launch moves to Thursday, and the release notes need one more pass on the pricing section.";

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const STATUS_TEXT: Record<VoiceDictationStatus, string> = {
  idle: "",
  requesting: "Waiting for microphone permission",
  listening: "Listening",
  processing: "Transcribing",
  denied: "Microphone access is blocked",
  unsupported: "Voice input is not supported in this browser",
  error: "Voice input failed",
};

/**
 * Microphone dictation: a mic button that expands into a live waveform pill with a timer, plus
 * a live transcript. Uses the Web Speech API when available and falls back to recording +
 * your `transcribe` function. Toggle or hold-to-talk, with a global shortcut.
 */
export function VoiceDictation({
  onTranscript,
  onInterim,
  onStatusChange,
  mode = "toggle",
  hotkey = ["mod", "shift", "d"],
  lang,
  transcribe,
  simulate,
  showTranscript = true,
  transcriptPlaceholder = "Listening…",
  disabled = false,
  className,
  ...props
}: VoiceDictationProps) {
  const reduced = useReducedMotion();
  const simulating = simulate !== undefined && simulate !== false;
  const script = typeof simulate === "string" ? simulate : DEFAULT_SCRIPT;

  const [status, setStatusState] = React.useState<VoiceDictationStatus>("idle");
  const statusRef = React.useRef(status);
  const setStatus = React.useCallback(
    (next: VoiceDictationStatus) => {
      if (statusRef.current === next) return;
      statusRef.current = next;
      setStatusState(next);
      onStatusChange?.(next);
    },
    [onStatusChange],
  );

  const [finalText, setFinalText] = React.useState("");
  const [interimText, setInterimText] = React.useState("");
  const [elapsed, setElapsed] = React.useState(0);
  const cancelled = React.useRef(false);
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  const startedAt = React.useRef(0);

  const emit = React.useCallback(
    (text: string) => {
      const clean = text.replace(/\s+/g, " ").trim();
      if (clean && !cancelled.current) onTranscript?.(clean);
    },
    [onTranscript],
  );

  const speech = useSpeechRecognition({
    lang,
    continuous: true,
    interimResults: true,
    onEnd: (final) => {
      if (simulating) return;
      if (recorderRef.current?.isRecording) void recorderRef.current.stop();
      if (statusRef.current === "listening" || statusRef.current === "processing") {
        emit(final);
        setStatus("idle");
      }
    },
    onError: (error) => {
      if (simulating || error.name === "aborted") return;
      if (recorderRef.current?.isRecording) void recorderRef.current.stop();
      if (error.name === "no-speech") setStatus("idle");
      else
        setStatus(
          error.name === "not-allowed" || error.name === "service-not-allowed" ? "denied" : "error",
        );
    },
  });
  const recorderError = React.useRef<Error | null>(null);
  const recorder = useMediaRecorder({
    onError: (error) => {
      recorderError.current = error;
    },
  });
  const recorderRef = React.useRef(recorder);
  recorderRef.current = recorder;
  const statusId = React.useId();
  const analyser = useAudioAnalyser({
    source: simulating ? null : recorder.stream,
    simulate: simulating && status === "listening" ? "speech" : false,
    bands: 24,
  });

  const supported = simulating || speech.isSupported || recorder.isSupported;

  // Mirror real recognition text while listening.
  React.useEffect(() => {
    if (simulating) return;
    setFinalText(speech.finalTranscript);
    setInterimText(speech.interimTranscript);
  }, [simulating, speech.finalTranscript, speech.interimTranscript]);

  React.useEffect(() => {
    if (status === "listening") onInterim?.(`${finalText}${interimText}`.trim());
  }, [status, finalText, interimText, onInterim]);

  // Timer.
  React.useEffect(() => {
    if (status !== "listening") return;
    startedAt.current = Date.now();
    setElapsed(0);
    const id = setInterval(() => setElapsed(Date.now() - startedAt.current), 250);
    return () => clearInterval(id);
  }, [status]);

  const clearTimers = React.useCallback(() => {
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
  }, []);
  React.useEffect(() => clearTimers, [clearTimers]);

  const start = React.useCallback(async () => {
    if (disabled) return;
    const s = statusRef.current;
    if (s === "listening" || s === "requesting" || s === "processing") return;
    cancelled.current = false;
    setFinalText("");
    setInterimText("");
    clearTimers();

    if (simulating) {
      setStatus("requesting");
      timers.current.push(
        setTimeout(() => {
          setStatus("listening");
          const words = script.split(/\s+/);
          words.forEach((_, i) => {
            timers.current.push(
              setTimeout(
                () => {
                  const done = words.slice(0, Math.max(0, i - 2)).join(" ");
                  const live = words.slice(Math.max(0, i - 2), i + 1).join(" ");
                  setFinalText(done ? `${done} ` : "");
                  setInterimText(live);
                  if (i === words.length - 1) {
                    timers.current.push(
                      setTimeout(() => {
                        setFinalText(script);
                        setInterimText("");
                      }, 500),
                    );
                  }
                },
                450 + i * 190,
              ),
            );
          });
        }, 450),
      );
      return;
    }

    if (!supported) {
      setStatus("unsupported");
      return;
    }
    setStatus("requesting");
    recorderError.current = null;
    if (recorder.isSupported) {
      const stream = await recorder.start();
      if (!stream) {
        const name = (recorderError.current as { name?: string } | null)?.name;
        setStatus(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "error");
        return;
      }
    }
    if (cancelled.current) {
      recorder.reset();
      setStatus("idle");
      return;
    }
    if (speech.isSupported) {
      speech.reset();
      speech.start();
    }
    setStatus("listening");
  }, [disabled, simulating, script, supported, recorder, speech, setStatus, clearTimers]);

  const stop = React.useCallback(async () => {
    const s = statusRef.current;
    if (s === "requesting") {
      cancelled.current = true;
      clearTimers();
      recorder.reset();
      setStatus("idle");
      return;
    }
    if (s !== "listening") return;

    if (simulating) {
      clearTimers();
      setStatus("processing");
      timers.current.push(
        setTimeout(() => {
          emit(`${finalText}${interimText}`);
          setInterimText("");
          setStatus("idle");
        }, 650),
      );
      return;
    }

    setStatus("processing");
    if (speech.isSupported) {
      speech.stop(); // onEnd emits the final transcript
      if (recorder.isRecording) void recorder.stop();
      return;
    }
    const blob = await recorder.stop();
    if (blob && transcribe) {
      try {
        emit(await transcribe(blob));
        setStatus("idle");
      } catch {
        setStatus("error");
      }
    } else {
      setStatus("idle");
    }
  }, [
    simulating,
    finalText,
    interimText,
    emit,
    speech,
    recorder,
    transcribe,
    setStatus,
    clearTimers,
  ]);

  const cancel = React.useCallback(() => {
    cancelled.current = true;
    clearTimers();
    if (!simulating) {
      speech.abort();
      recorder.reset();
    }
    setFinalText("");
    setInterimText("");
    setStatus("idle");
  }, [simulating, speech, recorder, setStatus, clearTimers]);

  const toggle = () => {
    const s = statusRef.current;
    if (s === "listening" || s === "requesting") void stop();
    else void start();
  };

  useHotkey(
    hotkey,
    (e) => {
      if (e.repeat) return;
      if (mode === "hold") void start();
      else toggle();
    },
    {
      enabled: !disabled && hotkey !== null,
      allowInInputs: true,
      onKeyUp: mode === "hold" ? () => void stop() : undefined,
    },
  );

  React.useEffect(() => {
    if (status !== "listening") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cancel();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [status, cancel]);

  const live = status === "listening" || status === "processing" || status === "requesting";
  const blocked = status === "denied" || status === "unsupported" || status === "error";
  const effective: VoiceDictationStatus = !supported && status === "idle" ? "unsupported" : status;
  const transcript = `${finalText}${interimText}`;

  const holdHandlers =
    mode === "hold"
      ? {
          onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
            if (e.button !== 0) return;
            e.currentTarget.setPointerCapture?.(e.pointerId);
            void start();
          },
          onPointerUp: () => void stop(),
          onPointerCancel: () => void stop(),
          onKeyDown: (e: React.KeyboardEvent) => {
            if ((e.key === " " || e.key === "Enter") && !e.repeat) {
              e.preventDefault();
              void start();
            }
          },
          onKeyUp: (e: React.KeyboardEvent) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              void stop();
            }
          },
        }
      : { onClick: toggle };

  const tooltipText =
    effective === "unsupported"
      ? "Voice input isn't supported here"
      : effective === "denied"
        ? "Microphone blocked"
        : mode === "hold"
          ? "Hold to dictate"
          : status === "listening"
            ? "Stop dictation"
            : "Dictate";

  const layoutTransition = reduced ? { duration: 0 } : springs.smooth;
  const swap = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, filter: "blur(2px)", scale: 0.9 },
        animate: { opacity: 1, filter: "blur(0px)", scale: 1 },
        exit: { opacity: 0, filter: "blur(2px)", scale: 0.9 },
      };

  return (
    <div
      data-slot="voice-dictation"
      data-status={effective}
      data-mode={mode}
      className={cn("flex min-w-0 flex-col items-start gap-3 font-kura-sans", className)}
      {...props}
    >
      <motion.div
        layout
        transition={layoutTransition}
        data-slot="voice-dictation-control"
        style={{ borderRadius: 999 }}
        className={cn(
          "relative flex h-8 items-center",
          live && "gap-1 bg-kura-accent-subtle p-0.5 pr-3 text-kura-accent-text",
        )}
      >
        <Tooltip content={tooltipText} shortcut={hotkey ?? undefined}>
          <motion.button
            layout="position"
            transition={layoutTransition}
            type="button"
            data-slot="voice-dictation-button"
            aria-label={mode === "hold" ? "Hold to dictate" : "Dictate"}
            aria-pressed={status === "listening"}
            aria-describedby={blocked ? statusId : undefined}
            disabled={disabled || effective === "unsupported" || status === "processing"}
            {...holdHandlers}
            className={cn(
              "relative flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none",
              "transition-[background-color,color,box-shadow] duration-(--kura-duration-fast) ease-kura-out",
              "focus-visible:shadow-kura-focus disabled:cursor-not-allowed disabled:opacity-50",
              live
                ? "bg-kura-accent text-kura-accent-fg hover:bg-kura-accent-hover"
                : blocked
                  ? "text-kura-danger-text hover:bg-kura-hover"
                  : "text-kura-fg-muted hover:bg-kura-hover hover:text-kura-fg",
              effective === "unsupported" && "text-kura-fg-subtle",
              mode === "hold" && "touch-none select-none",
            )}
          >
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={live ? "stop" : blocked ? "off" : "mic"}
                className="flex"
                transition={springs.snappy}
                {...swap}
              >
                {status === "requesting" ? (
                  <Spinner size="sm" label={null} />
                ) : live && mode === "toggle" ? (
                  <span aria-hidden className="size-2.5 rounded-[2.5px] bg-current" />
                ) : blocked ? (
                  <MicOff aria-hidden className="size-4" />
                ) : (
                  <Mic aria-hidden className="size-4" />
                )}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </Tooltip>
        <AnimatePresence initial={false}>
          {live && (
            <motion.div
              key="live"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: reduced ? 0 : 0.08, duration: 0.2 } }}
              exit={{ opacity: 0, transition: { duration: 0.09 } }}
              className="flex items-center gap-2"
            >
              {status === "processing" ? (
                <ShimmerText className="px-1 text-[13px]">Transcribing…</ShimmerText>
              ) : (
                <>
                  <AudioWaveform
                    analyser={analyser}
                    variant="mirrored"
                    tone="accent"
                    barWidth={2}
                    barGap={2}
                    active={status === "listening"}
                    className="h-5 w-16"
                    aria-hidden
                  />
                  <span className="w-8 text-right font-medium text-xs tabular-nums">
                    {formatElapsed(elapsed)}
                  </span>
                  <button
                    type="button"
                    data-slot="voice-dictation-cancel"
                    aria-label="Cancel dictation"
                    onClick={cancel}
                    className="-mr-1.5 flex size-6 cursor-pointer items-center justify-center rounded-full opacity-70 outline-none transition-[opacity,background-color] duration-(--kura-duration-fast) hover:bg-kura-hover hover:opacity-100 focus-visible:shadow-kura-focus"
                  >
                    <X aria-hidden className="size-3.5" />
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <span id={statusId} role="status" className="sr-only">
        {STATUS_TEXT[effective]}
      </span>

      {blocked && (
        <p
          data-slot="voice-dictation-message"
          className="max-w-xs animate-kura-fade-in text-kura-danger-text text-xs"
        >
          {status === "denied"
            ? "Microphone access is blocked. Allow it in your browser's site settings and try again."
            : status === "unsupported"
              ? "This browser can't record audio. Try Chrome, Edge or Safari."
              : "Something went wrong with voice input. Try again."}
        </p>
      )}

      {showTranscript && live && (
        <div
          data-slot="voice-dictation-transcript"
          className={cn(
            "w-full min-w-0 animate-kura-fade-in rounded-kura-lg bg-kura-surface px-3.5 py-3 text-[15px] leading-6 shadow-kura-sm",
          )}
        >
          {transcript ? (
            <p className="text-pretty">
              <span className="text-kura-fg">{finalText}</span>
              <span className="text-kura-fg-subtle">{interimText}</span>
              {status === "listening" && (
                <span
                  aria-hidden
                  className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[3px] animate-kura-pulse rounded-full bg-kura-accent motion-reduce:animate-none"
                />
              )}
            </p>
          ) : (
            <p className="text-kura-fg-subtle">
              {status === "requesting" ? "Allow microphone access…" : transcriptPlaceholder}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
