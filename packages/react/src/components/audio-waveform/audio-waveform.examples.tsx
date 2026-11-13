"use client";

import { Pause, Play } from "lucide-react";
import * as React from "react";
import { IconButton } from "../icon-button";
import { AudioWaveform } from "./audio-waveform";

export function AudioWaveformMinimal() {
  return (
    <div className="w-64">
      <AudioWaveform simulate />
    </div>
  );
}

/** Deterministic, speech-like amplitude envelope for demos. */
function demoPeaks(count: number, seed = 7): number[] {
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  return Array.from({ length: count }, (_, i) => {
    const phrase = Math.sin((i / count) * Math.PI * 5.3) * 0.5 + 0.5;
    const gap = i % 37 < 3 ? 0.08 : 1;
    return Math.min(1, (0.15 + 0.85 * phrase * (0.45 + rand() * 0.55)) * gap);
  });
}

/** A pretend player: advances `progress` in real time while playing. */
function usePlayback(duration: number, initial = 0) {
  const [progress, setProgress] = React.useState(initial);
  const [playing, setPlaying] = React.useState(false);
  React.useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setProgress((p) => {
        const next = p + 0.1 / duration;
        if (next >= 1) {
          setPlaying(false);
          return 1;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(id);
  }, [playing, duration]);
  const toggle = () => {
    if (progress >= 1) setProgress(0);
    setPlaying((p) => !p);
  };
  return { progress, setProgress, playing, toggle };
}

function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export function AudioWaveformFull() {
  const peaks = React.useMemo(() => demoPeaks(220), []);
  const { progress, setProgress, playing, toggle } = usePlayback(64, 0.32);
  return (
    <div className="flex w-full max-w-lg items-center gap-3 rounded-kura-xl bg-kura-surface p-2 pr-4 shadow-kura-surface">
      <IconButton
        label={playing ? "Pause" : "Play"}
        icon={playing ? <Pause className="fill-current" /> : <Play className="fill-current" />}
        variant="primary"
        size="md"
        tooltip={false}
        onClick={toggle}
      />
      <AudioWaveform
        peaks={peaks}
        progress={progress}
        onSeek={setProgress}
        duration={64}
        barWidth={2}
        barGap={2}
        label="Seek recording"
        className="h-9 flex-1"
      />
      <span className="w-9 shrink-0 text-right font-kura-mono text-[12px] text-kura-fg-muted tabular-nums">
        {formatTime(progress * 64)}
      </span>
    </div>
  );
}

export function AudioWaveformVariants() {
  return (
    <div className="grid w-full max-w-lg grid-cols-3 gap-6 font-kura-sans text-[12px] text-kura-fg-subtle">
      <figure className="flex flex-col gap-2.5">
        <AudioWaveform simulate="music" variant="bars" label="Music spectrum" className="h-10" />
        <figcaption>Spectrum</figcaption>
      </figure>
      <figure className="flex flex-col gap-2.5">
        <AudioWaveform simulate="speech" label="Voice level" className="h-10" />
        <figcaption>Voice</figcaption>
      </figure>
      <figure className="flex flex-col gap-2.5">
        <AudioWaveform simulate="speech" variant="line" label="Voice signal" className="h-10" />
        <figcaption>Signal</figcaption>
      </figure>
    </div>
  );
}

export function AudioWaveformVoiceNote() {
  const peaks = React.useMemo(() => demoPeaks(48, 3), []);
  const { progress, setProgress, playing, toggle } = usePlayback(14);
  return (
    <div className="flex w-64 items-center gap-2 rounded-kura-xl bg-kura-raised py-1.5 pr-3.5 pl-1.5 shadow-kura-raised">
      <IconButton
        label={playing ? "Pause voice note" : "Play voice note"}
        icon={playing ? <Pause className="fill-current" /> : <Play className="fill-current" />}
        size="sm"
        tooltip={false}
        onClick={toggle}
      />
      <AudioWaveform
        peaks={peaks}
        progress={progress}
        onSeek={setProgress}
        duration={14}
        barWidth={2}
        barGap={2}
        label="Seek voice note"
        className="h-7 flex-1"
      />
      <span className="font-kura-mono text-[11.5px] text-kura-fg-subtle tabular-nums">
        {formatTime(playing || progress > 0 ? progress * 14 : 14)}
      </span>
    </div>
  );
}
