import { describe, expect, it, vi } from "vitest";
import { act, axe, render, screen, setReducedMotion, userEvent } from "../../../test/utils";
import { DecodeText } from "./decode-text";
import {
  DecodeTextAgentHandshake,
  DecodeTextFull,
  DecodeTextMinimal,
} from "./decode-text.examples";

/** Drive requestAnimationFrame manually with a fake clock. */
function fakeFrames() {
  let now = 0;
  let queue: FrameRequestCallback[] = [];
  vi.spyOn(performance, "now").mockImplementation(() => now);
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    queue.push(cb);
    return queue.length;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  return (ms: number) => {
    const end = now + ms;
    while (now < end) {
      now += 16;
      const q = queue;
      queue = [];
      act(() => {
        for (const cb of q) cb(now);
      });
    }
  };
}

const root = (c: HTMLElement) => c.querySelector<HTMLElement>("[data-slot=decode-text]")!;

describe("DecodeText", () => {
  it("gives screen readers the final text immediately and hides the glyphs", () => {
    const { container } = render(<DecodeText className="custom">Hello world</DecodeText>);
    expect(root(container)).toHaveClass("custom");
    expect(screen.getByText("Hello world")).toHaveClass("sr-only");
    expect(container.querySelector("[data-slot=decode-text-glyphs]")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    // one slot per non-space character
    expect(container.querySelectorAll("[data-slot=decode-text-char]")).toHaveLength(10);
  });

  it("scrambles, then resolves to the final text and calls onComplete", () => {
    const advance = fakeFrames();
    const onComplete = vi.fn();
    const { container } = render(
      <DecodeText duration={300} onComplete={onComplete}>
        Decode me
      </DecodeText>,
    );
    expect(root(container)).toHaveAttribute("data-state", "running");
    advance(400);
    expect(root(container)).toHaveAttribute("data-state", "done");
    expect(container.querySelector("[data-slot=decode-text-glyphs]")).toHaveTextContent(
      "Decode me",
    );
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("replays when trigger changes", () => {
    const advance = fakeFrames();
    const { container, rerender } = render(
      <DecodeText duration={200} trigger={0}>
        Again
      </DecodeText>,
    );
    advance(300);
    expect(root(container)).toHaveAttribute("data-state", "done");
    rerender(
      <DecodeText duration={200} trigger={1}>
        Again
      </DecodeText>,
    );
    expect(root(container)).toHaveAttribute("data-state", "running");
  });

  it("waits for view when startOn is view (no IntersectionObserver hit in jsdom)", () => {
    const { container } = render(<DecodeText startOn="view">Later</DecodeText>);
    expect(root(container)).toHaveAttribute("data-state", "pending");
  });

  it("shows the final text immediately under reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(<DecodeText>Calm</DecodeText>);
    expect(root(container)).toHaveAttribute("data-state", "done");
    expect(container.querySelector("[data-slot=decode-text-glyphs]")).toHaveTextContent("Calm");
  });

  it("toggles the handshake example", async () => {
    render(<DecodeTextAgentHandshake />);
    await userEvent.click(screen.getByRole("button", { name: "Connect" }));
    expect(screen.getByRole("status")).toHaveTextContent("Connected to build-runner-07");
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [DecodeTextMinimal, DecodeTextFull, DecodeTextAgentHandshake]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
