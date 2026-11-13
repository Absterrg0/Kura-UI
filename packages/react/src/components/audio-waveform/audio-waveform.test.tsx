import { describe, expect, it, vi } from "vitest";
import {
  act,
  axe,
  fireEvent,
  render,
  screen,
  setReducedMotion,
  userEvent,
} from "../../../test/utils";
import { AudioWaveform, peaksFromSamples } from "./audio-waveform";
import {
  AudioWaveformFull,
  AudioWaveformMinimal,
  AudioWaveformVariants,
  AudioWaveformVoiceNote,
} from "./audio-waveform.examples";

describe("AudioWaveform", () => {
  it("renders a labelled image with data-slot and a hidden canvas", () => {
    render(<AudioWaveform simulate className="h-8" />);
    const root = screen.getByRole("img", { name: "Audio waveform" });
    expect(root).toHaveAttribute("data-slot", "audio-waveform");
    expect(root).toHaveAttribute("data-mode", "live");
    expect(root).toHaveAttribute("data-status", "simulated");
    expect(root).toHaveClass("h-8");
    expect(root.querySelector("canvas")).toHaveAttribute("aria-hidden", "true");
  });

  it("falls back gracefully without Web Audio or canvas (jsdom)", () => {
    const stream = {} as MediaStream;
    render(<AudioWaveform source={stream} />);
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("becomes a keyboard and pointer seek slider in static mode", async () => {
    const onSeek = vi.fn();
    render(<AudioWaveform peaks={[0.2, 0.8, 0.5]} progress={0.5} duration={60} onSeek={onSeek} />);
    const slider = screen.getByRole("slider", { name: "Seek" });
    expect(slider).toHaveAttribute("data-mode", "static");
    expect(slider).toHaveAttribute("aria-valuenow", "50");
    expect(slider).toHaveAttribute("aria-valuetext", "0:30 of 1:00");
    slider.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onSeek).toHaveBeenLastCalledWith(0.55);
    await userEvent.keyboard("{Shift>}{ArrowLeft}{/Shift}");
    expect(onSeek).toHaveBeenLastCalledWith(0.4);
    await userEvent.keyboard("{End}");
    expect(onSeek).toHaveBeenLastCalledWith(1);

    slider.getBoundingClientRect = () =>
      ({ left: 0, width: 200, top: 0, height: 40, right: 200, bottom: 40 }) as DOMRect;
    fireEvent.pointerDown(slider, { clientX: 50, pointerId: 1 });
    expect(onSeek).toHaveBeenLastCalledWith(0.25);
    expect(slider).toHaveAttribute("data-scrubbing", "true");
    fireEvent.pointerUp(slider, { pointerId: 1 });
    expect(slider).not.toHaveAttribute("data-scrubbing");
  });

  it("plays and pauses the voice note", async () => {
    vi.useFakeTimers();
    try {
      render(<AudioWaveformVoiceNote />);
      const slider = screen.getByRole("slider", { name: "Seek voice note" });
      expect(slider).toHaveAttribute("aria-valuenow", "0");
      fireEvent.click(screen.getByRole("button", { name: "Play voice note" }));
      act(() => vi.advanceTimersByTime(7000));
      expect(slider).toHaveAttribute("aria-valuenow", "50");
      fireEvent.click(screen.getByRole("button", { name: "Pause voice note" }));
      act(() => vi.advanceTimersByTime(3000));
      expect(slider).toHaveAttribute("aria-valuenow", "50");
    } finally {
      vi.useRealTimers();
    }
  });

  it("computes normalised peaks from samples", () => {
    expect(peaksFromSamples([0, 0.5, -0.25, 0.25], 2)).toEqual([1, 0.5]);
    expect(peaksFromSamples([], 3)).toEqual([0, 0, 0]);
  });

  it("applies tone colours via tokens", () => {
    render(<AudioWaveform simulate tone="accent" />);
    expect(screen.getByRole("img")).toHaveClass("text-kura-accent");
  });

  it("still renders under reduced motion (throttled meter)", () => {
    setReducedMotion(true);
    render(<AudioWaveform simulate variant="bars" />);
    expect(screen.getByRole("img")).toHaveAttribute("data-variant", "bars");
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [
      AudioWaveformMinimal,
      AudioWaveformFull,
      AudioWaveformVariants,
      AudioWaveformVoiceNote,
    ]) {
      const { container, unmount } = render(<Example />);
      await act(async () => {});
      await axe(container);
      unmount();
    }
  });
});
