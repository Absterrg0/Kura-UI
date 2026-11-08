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
  const time = (x: number) =>
    `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, "0")}`;
  return (
    <div className="flex w-full max-w-lg flex-col gap-8">
      <div className="flex flex-col gap-3 rounded-kura-md bg-kura-surface-raised px-4 pt-3.5 pb-4 shadow-kura-sm">
        <div className="flex items-baseline justify-between gap-3 font-kura-mono text-[10px] text-kura-fg-subtle uppercase tracking-[0.14em]">
          <span className="truncate">Customer call · Hoshino Coffee</span>
          <span className="shrink-0 tabular-nums">12 Sep</span>
        </div>
        <div className="flex items-center gap-3">
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
          <span className="shrink-0 font-kura-mono text-[11px] text-kura-fg-muted tabular-nums">
            {time(t)}
            <span className="text-kura-fg-subtle"> / {time(DURATION)}</span>
          </span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-6">
        {(
          [
            ["Bars · spectrum", "music", "bars", "spectrum", "default"],
            ["Mirrored · history", "speech", "mirrored", "history", "default"],
            ["Line", "speech", "line", undefined, "muted"],
          ] as const
        ).map(([caption, sim, variant, display, tone]) => (
          <figure key={caption} className="flex flex-col gap-3 border-kura-border border-t pt-2.5">
            <figcaption className="font-kura-mono text-[10px] text-kura-fg-subtle uppercase tracking-[0.14em]">
              {caption}
            </figcaption>
            <AudioWaveform
              simulate={sim}
              variant={variant}
              display={display}
              tone={tone}
              className="h-12"
            />
          </figure>
        ))}
      </div>
    </div>
  );
}

export function AudioWaveformVoiceNote() {
  const peaks = React.useMemo(() => demoPeaks(48, 3), []);
  const [progress, setProgress] = React.useState(0);
  return (
    <div className="flex w-full max-w-sm flex-col items-end gap-2">
      <div className="flex w-64 items-center gap-2.5 rounded-kura-lg rounded-br-kura-xs bg-kura-surface-sunken py-2 pr-3.5 pl-2 shadow-[inset_0_0_0_1px_var(--kura-border-subtle)]">
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
          tone="muted"
          label="Seek voice note"
          className="h-7 flex-1"
        />
        <span className="font-kura-mono text-[11px] text-kura-fg-subtle tabular-nums">0:14</span>
      </div>
      <span className="pr-1 font-kura-mono text-[10px] text-kura-fg-subtle uppercase tracking-[0.12em]">
        Voice note · 09:41 · transcribed
      </span>
    </div>
  );
}
