import { afterEach, describe, expect, it, vi } from "vitest";
import { act, axe, render, screen, setReducedMotion, userEvent } from "../../../test/utils";
import { formatSeconds, Reasoning } from "./reasoning";
import { ReasoningFull, ReasoningInMessage, ReasoningMinimal } from "./reasoning.examples";

describe("Reasoning", () => {
  afterEach(() => vi.useRealTimers());

  it("renders collapsed with a done label and data-slot", () => {
    const { container } = render(
      <Reasoning duration={14} className="custom">
        trace
      </Reasoning>,
    );
    const root = container.querySelector("[data-slot=reasoning]")!;
    expect(root).toHaveClass("custom");
    expect(root).toHaveAttribute("data-state", "closed");
    expect(root).toHaveAttribute("data-status", "done");
    const trigger = screen.getByRole("button", { name: "Thought for 14s" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(container.querySelector("[data-slot=reasoning-content]")).toHaveAttribute("inert");
  });

  it("toggles open on click", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Reasoning duration={3} onOpenChange={onOpenChange}>
        trace
      </Reasoning>,
    );
    const trigger = screen.getByRole("button");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(document.querySelector("[data-slot=reasoning-content]")).not.toHaveAttribute("inert");
  });

  it("shows a ticking shimmer while active, then auto-collapses", () => {
    vi.useFakeTimers();
    const { rerender, container } = render(<Reasoning active>trace</Reasoning>);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute("data-state", "open");
    expect(container.querySelector("[data-slot=reasoning-label]")).toHaveAttribute(
      "data-active",
      "true",
    );
    act(() => vi.advanceTimersByTime(12_000));
    expect(screen.getByRole("button")).toHaveTextContent("Thinking… 12s");
    expect(screen.getByRole("status")).toHaveTextContent("Thinking");
    act(() => vi.advanceTimersByTime(2_000));
    rerender(<Reasoning active={false}>trace</Reasoning>);
    expect(root).toHaveAttribute("data-state", "closed");
    expect(screen.getByRole("button")).toHaveTextContent("Thought for 14s");
  });

  it("does not auto-collapse if the reader toggled it while active", async () => {
    const user = userEvent.setup();
    const { rerender, container } = render(<Reasoning active>trace</Reasoning>);
    await user.click(screen.getByRole("button"));
    await user.click(screen.getByRole("button"));
    rerender(<Reasoning active={false}>trace</Reasoning>);
    expect(container.firstElementChild).toHaveAttribute("data-state", "open");
  });

  it("supports a controlled open state and custom labels", () => {
    render(
      <Reasoning open duration={90} formatLabel={({ seconds }) => `Took ${seconds}s`}>
        trace
      </Reasoning>,
    );
    expect(screen.getByRole("button", { name: "Took 90s" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("formats durations", () => {
    expect(formatSeconds(4.4)).toBe("4s");
    expect(formatSeconds(83)).toBe("1m 23s");
    expect(formatSeconds(120)).toBe("2m");
  });

  it("drops the height travel and blur under reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(<Reasoning duration={2}>trace</Reasoning>);
    expect(container.querySelector("[data-slot=reasoning-content]")!.className).toContain(
      "motion-reduce:transition-opacity",
    );
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [ReasoningMinimal, ReasoningFull, ReasoningInMessage]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
