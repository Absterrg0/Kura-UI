import { act, renderHook } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, setReducedMotion, waitFor } from "../../test/utils";
import { useAudioAnalyser } from "./use-audio-analyser";
import { useControllableState } from "./use-controllable-state";
import { useFocusFallback } from "./use-focus-fallback";
import { useHotkey } from "./use-hotkey";
import { useMediaRecorder } from "./use-media-recorder";
import { useReducedMotion } from "./use-reduced-motion";
import { useSpeechRecognition } from "./use-speech-recognition";

describe("useControllableState", () => {
  it("works uncontrolled", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControllableState({ defaultValue: 1, onChange }));
    act(() => result.current[1]((v) => v + 1));
    expect(result.current[0]).toBe(2);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("works controlled and skips unchanged values", () => {
    const onChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }) => useControllableState({ value, defaultValue: 0, onChange }),
      { initialProps: { value: 5 } },
    );
    act(() => result.current[1](6));
    expect(result.current[0]).toBe(5); // parent owns it
    expect(onChange).toHaveBeenCalledWith(6);
    rerender({ value: 6 });
    expect(result.current[0]).toBe(6);
    act(() => result.current[1](6));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe("useReducedMotion", () => {
  it("tracks the media query live", () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    setReducedMotion(true);
    expect(result.current).toBe(true);
  });
});

describe("useHotkey", () => {
  it("fires on exact combos only", () => {
    const handler = vi.fn();
    renderHook(() => useHotkey(["mod", "k"], handler));
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    fireEvent.keyDown(document, { key: "k", ctrlKey: true, shiftKey: true });
    fireEvent.keyDown(document, { key: "k" });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("matches the space bar", () => {
    const handler = vi.fn();
    renderHook(() => useHotkey(["mod", "space"], handler));
    fireEvent.keyDown(document, { key: " ", ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does nothing when keys is null or disabled", () => {
    const handler = vi.fn();
    renderHook(() => useHotkey(null, handler));
    renderHook(() => useHotkey(["escape"], handler, { enabled: false }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("leaves a key alone once another handler has taken it", () => {
    const handler = vi.fn();
    renderHook(() => useHotkey(["escape"], handler));
    const menu = document.createElement("div");
    menu.addEventListener("keydown", (e) => e.preventDefault());
    document.body.append(menu);
    fireEvent.keyDown(menu, { key: "Escape" });
    expect(handler).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(handler).toHaveBeenCalledTimes(1);
    menu.remove();
  });

  it("can stand down while focus is inside a dialog, menu or listbox", () => {
    const page = vi.fn();
    const everywhere = vi.fn();
    renderHook(() => useHotkey(["mod", "enter"], page, { allowInOverlays: false }));
    renderHook(() => useHotkey(["mod", "enter"], everywhere, { preventDefault: false }));
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    const button = document.createElement("button");
    dialog.append(button);
    document.body.append(dialog);
    fireEvent.keyDown(button, { key: "Enter", ctrlKey: true });
    expect(page).not.toHaveBeenCalled();
    expect(everywhere).toHaveBeenCalledTimes(1);
    dialog.remove();
  });
});

function Rows({ ids, onRemove }: { ids: string[]; onRemove: (id: string) => void }) {
  const root = React.useRef<HTMLUListElement>(null);
  useFocusFallback(root, (gap) => (gap.next ?? gap.previous)?.querySelector("button"));
  return (
    <ul ref={root} tabIndex={-1} aria-label="Queue">
      {ids.map((id) => (
        <li key={id}>
          <button type="button" onClick={() => onRemove(id)}>
            Remove {id}
          </button>
        </li>
      ))}
    </ul>
  );
}

describe("useFocusFallback", () => {
  it("moves focus to the neighbour when the focused control is removed, then to the root", async () => {
    let ids = ["a", "b", "c"];
    const view = () => <Rows ids={ids} onRemove={() => {}} />;
    const { rerender } = render(view());
    screen.getByRole("button", { name: "Remove b" }).focus();
    ids = ["a", "c"];
    rerender(view());
    await waitFor(() => expect(screen.getByRole("button", { name: "Remove c" })).toHaveFocus());
    ids = ["a"];
    rerender(view());
    await waitFor(() => expect(screen.getByRole("button", { name: "Remove a" })).toHaveFocus());
    ids = [];
    rerender(view());
    await waitFor(() => expect(screen.getByRole("list", { name: "Queue" })).toHaveFocus());
  });

  it("leaves a person alone who has already moved on", async () => {
    let ids = ["a", "b"];
    const view = () => (
      <>
        <Rows ids={ids} onRemove={() => {}} />
        <input aria-label="Elsewhere" />
      </>
    );
    const { rerender } = render(view());
    screen.getByRole("button", { name: "Remove b" }).focus();
    screen.getByRole("textbox", { name: "Elsewhere" }).focus();
    ids = ["a"];
    rerender(view());
    await act(async () => {});
    expect(screen.getByRole("textbox", { name: "Elsewhere" })).toHaveFocus();
  });
});

describe("useAudioAnalyser", () => {
  it("is idle without a source and returns silent frames", () => {
    const { result } = renderHook(() => useAudioAnalyser({ bands: 8 }));
    expect(result.current.status).toBe("idle");
    const frame = result.current.read();
    expect(frame.bands).toHaveLength(8);
    expect(frame.level).toBe(0);
  });

  it("simulates speech deterministically within range", () => {
    const { result } = renderHook(() =>
      useAudioAnalyser({ simulate: true, bands: 16, fftSize: 256 }),
    );
    expect(result.current.status).toBe("simulated");
    let max = 0;
    for (let i = 0; i < 30; i++) {
      vi.spyOn(performance, "now").mockReturnValue(1000 + i * 137);
      const f = result.current.read();
      for (const b of f.bands) {
        expect(b).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThanOrEqual(1);
      }
      expect(f.waveform).toHaveLength(256);
      max = Math.max(max, f.level);
    }
    expect(max).toBeGreaterThan(0.05);
  });

  it("reports unsupported for real sources when Web Audio is missing (SSR/jsdom)", () => {
    const fakeStream = {} as MediaStream;
    const { result } = renderHook(() => useAudioAnalyser({ source: fakeStream }));
    expect(result.current.status).toBe("unsupported");
  });

  it("subscribe delivers frames via requestAnimationFrame and unsubscribes", async () => {
    const { result } = renderHook(() => useAudioAnalyser({ simulate: "music" }));
    const listener = vi.fn();
    const off = result.current.subscribe(listener);
    await new Promise((r) => setTimeout(r, 60));
    off();
    expect(listener).toHaveBeenCalled();
  });
});

describe("useMediaRecorder", () => {
  it("degrades to unsupported without MediaRecorder", async () => {
    const { result } = renderHook(() => useMediaRecorder());
    expect(result.current.isSupported).toBe(false);
    expect(result.current.status).toBe("unsupported");
    let stream: MediaStream | null = null;
    await act(async () => {
      stream = await result.current.start();
    });
    expect(stream).toBeNull();
    expect(await result.current.stop()).toBeNull();
  });
});

describe("useSpeechRecognition", () => {
  it("degrades to unsupported without the Web Speech API", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.isSupported).toBe(false);
    expect(result.current.status).toBe("unsupported");
  });

  it("collects interim and final transcripts from a speech implementation", () => {
    let instance: Record<string, unknown> & {
      onresult?: (e: unknown) => void;
      onend?: () => void;
    } = {};
    class FakeRecognition {
      lang = "";
      continuous = false;
      interimResults = false;
      onresult: ((e: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      onerror = null;
      onstart = null;
      constructor() {
        instance = this as never;
      }
      start() {}
      stop() {
        this.onend?.();
      }
      abort() {}
    }
    (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition = FakeRecognition;
    const onEnd = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition({ onEnd }));
    expect(result.current.isSupported).toBe(true);
    act(() => result.current.start());
    expect(result.current.isListening).toBe(true);
    act(() =>
      instance.onresult?.({
        resultIndex: 0,
        results: {
          length: 1,
          0: { isFinal: false, length: 1, 0: { transcript: "hel", confidence: 0.5 } },
        },
      }),
    );
    expect(result.current.interimTranscript).toBe("hel");
    act(() =>
      instance.onresult?.({
        resultIndex: 0,
        results: {
          length: 1,
          0: { isFinal: true, length: 1, 0: { transcript: "hello", confidence: 0.9 } },
        },
      }),
    );
    expect(result.current.transcript).toBe("hello");
    act(() => result.current.stop());
    expect(onEnd).toHaveBeenCalledWith("hello");
    expect(result.current.status).toBe("idle");
    delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
  });
});
