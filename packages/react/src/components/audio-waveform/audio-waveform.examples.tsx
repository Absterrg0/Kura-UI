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

const DURATION = 64;

export function AudioWaveformFull() {
  const peaks = React.useMemo(() => demoPeaks(220), []);
  const [progress, setProgress] = React.useState(0.32);
  const [playing, setPlaying] = React.useState(false);

  React.useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setProgress((p) => {
        const next = p + 0.1 / DURATION;
        if (next >= 1) {
          setPlaying(false);
          return 1;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(id);
  }, [playing]);

  const t = progress * DURATION;
  return (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <div className="flex items-center gap-3 rounded-kura-xl bg-kura-surface p-2 pr-4 shadow-kura-sm">
        <IconButton
          label={playing ? "Pause" : "Play"}
          icon={playing ? <Pause className="fill-current" /> : <Play className="fill-current" />}
          variant="primary"
          size="md"
          className="rounded-full"
          tooltip={false}
          onClick={() => {
            if (progress >= 1) setProgress(0);
            setPlaying((p) => !p);
          }}
        />
        <AudioWaveform
          peaks={peaks}
          progress={progress}
          onSeek={setProgress}
          duration={DURATION}
          variant="mirrored"
          barWidth={2}
          barGap={2}
          minBarHeight={2}
          label="Seek recording"
          className="h-9 flex-1"
        />
        <span className="w-9 shrink-0 text-right text-kura-fg-muted text-xs tabular-nums">
          {Math.floor(t / 60)}:{String(Math.floor(t % 60)).padStart(2, "0")}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <figure className="flex flex-col gap-2">
          <AudioWaveform simulate="music" variant="bars" display="spectrum" className="h-12" />
          <figcaption className="text-center text-kura-fg-subtle text-xs">
            bars · spectrum
          </figcaption>
        </figure>
        <figure className="flex flex-col gap-2">
          <AudioWaveform simulate="speech" variant="mirrored" display="history" className="h-12" />
          <figcaption className="text-center text-kura-fg-subtle text-xs">
            mirrored · history
          </figcaption>
        </figure>
        <figure className="flex flex-col gap-2">
          <AudioWaveform simulate="speech" variant="line" tone="muted" className="h-12" />
          <figcaption className="text-center text-kura-fg-subtle text-xs">line</figcaption>
        </figure>
      </div>
    </div>
  );
}

export function AudioWaveformVoiceNote() {
  const peaks = React.useMemo(() => demoPeaks(48, 3), []);
  const [progress, setProgress] = React.useState(0);
  return (
    <div className="flex w-full max-w-sm flex-col items-end gap-2">
      <div className="flex w-64 items-center gap-2.5 rounded-kura-2xl rounded-br-kura-sm bg-kura-surface-sunken py-2 pr-3.5 pl-2 shadow-kura-xs">
        <IconButton
          label="Play voice note"
          icon={<Play className="fill-current" />}
          variant="secondary"
          size="sm"
          className="rounded-full"
          tooltip={false}
          onClick={() => setProgress((p) => (p >= 1 ? 0 : Math.min(1, p + 0.25)))}
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
        <span className="text-[11px] text-kura-fg-subtle tabular-nums">0:14</span>
      </div>
      <span className="pr-1 text-[11px] text-kura-fg-subtle">Voice note · transcribed</span>
    </div>
  );
}
