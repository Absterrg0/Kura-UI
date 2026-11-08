import { afterEach, describe, expect, it, vi } from "vitest";
import { act, axe, render, renderHook, setReducedMotion } from "../../../test/utils";
import { StreamingText } from "./streaming-text";
import {
  StreamingTextComposition,
  StreamingTextFull,
  StreamingTextMinimal,
} from "./streaming-text.examples";
import { useStreamingText } from "./use-streaming-text";

async function* tokens(parts: string[]) {
  for (const p of parts) {
    await Promise.resolve();
    yield p;
  }
}

/** Advance in steps so React commits (and starts the reveal loop) between timer batches. */
const advance = async (ms: number) => {
  for (let t = 0; t < ms; t += 100) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(Math.min(100, ms - t));
    });
  }
};

describe("StreamingText", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders initial text immediately with a data-slot and passes className through", () => {
    const { container } = render(<StreamingText text="Hello world" className="custom" />);
    const root = container.querySelector("[data-slot=streaming-text]")!;
    expect(root).toHaveClass("custom");
    expect(root).toHaveTextContent("Hello world");
    expect(root).toHaveAttribute("data-status", "done");
    expect(root.querySelector("[data-slot=streaming-text-caret]")).toHaveAttribute(
      "data-visible",
      "false",
    );
  });

  it("reveals a growing string in word groups at an even cadence", async () => {
    vi.useFakeTimers();
    const { container, rerender } = render(<StreamingText text="" streaming speed={60} />);
    const root = container.querySelector("[data-slot=streaming-text]")!;
    expect(root).toHaveAttribute("aria-busy", "true");
    const burst = "one two three four five six seven eight nine ten eleven twelve";
    rerender(<StreamingText text={burst} streaming speed={60} />);
    expect(root.textContent).toBe("");
    await advance(100);
    const partial = root.textContent!;
    expect(partial.length).toBeGreaterThan(0);
    expect(partial.length).toBeLessThan(burst.length);
    // never cuts a word in half
    expect(burst.startsWith(partial)).toBe(true);
    expect(/\S$/.test(partial) ? burst[partial.length] === " " : true).toBe(true);
    await advance(2000);
    expect(root.textContent).toBe(burst);
    rerender(<StreamingText text={burst} streaming={false} speed={60} />);
    expect(root).toHaveAttribute("data-status", "done");
  });

  it("settles animated chunks into a single text node", async () => {
    vi.useFakeTimers();
    const { container, rerender } = render(<StreamingText text="" streaming />);
    rerender(<StreamingText text="alpha beta gamma delta" streaming={false} />);
    await advance(400);
    expect(container.querySelectorAll("[data-slot=streaming-text-chunk]").length).toBeGreaterThan(
      0,
    );
    await advance(2000);
    expect(container.querySelectorAll("[data-slot=streaming-text-chunk]")).toHaveLength(0);
    expect(container.textContent).toBe("alpha beta gamma delta");
  });

  it("reads an async iterable and calls onComplete once", async () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    const { container } = render(
      <StreamingText stream={tokens(["Hi ", "there, ", "friend."])} onComplete={onComplete} />,
    );
    await advance(3000);
    expect(container.textContent).toBe("Hi there, friend.");
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(container.querySelector("[data-slot=streaming-text]")).toHaveAttribute(
      "data-status",
      "done",
    );
  });

  it("shows text as it arrives when speed is 0", () => {
    const { container, rerender } = render(<StreamingText text="" streaming speed={0} />);
    rerender(<StreamingText text="instant text" streaming speed={0} />);
    expect(container.textContent).toBe("instant text");
  });

  it("restarts on a non-append change", async () => {
    vi.useFakeTimers();
    const { container, rerender } = render(<StreamingText text="first answer" />);
    rerender(<StreamingText text="second answer" streaming />);
    await advance(2000);
    expect(container.textContent).toBe("second answer");
  });

  it("useStreamingText exposes displayed text", async () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook((p: { text: string }) => useStreamingText(p), {
      initialProps: { text: "" },
    });
    rerender({ text: "abc def" });
    await advance(1500);
    expect(result.current.displayed).toBe("abc def");
    expect(result.current.isStreaming).toBe(false);
  });

  it("drops blur and the caret loop under reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(<StreamingText text="" streaming />);
    expect(container.querySelector("[data-slot=streaming-text-caret]")!.className).toContain(
      "motion-reduce:animate-none",
    );
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [StreamingTextMinimal, StreamingTextFull, StreamingTextComposition]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
