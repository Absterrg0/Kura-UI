import { describe, expect, it, vi } from "vitest";
import { act, axe, render, screen, setReducedMotion, userEvent } from "../../../test/utils";
import { ThinkingIndicator } from "./thinking-indicator";
import {
  ThinkingIndicatorFull,
  ThinkingIndicatorInThreadList,
  ThinkingIndicatorMinimal,
} from "./thinking-indicator.examples";

describe("ThinkingIndicator", () => {
  it("is a polite status with a hidden label and data attributes", () => {
    render(<ThinkingIndicator className="custom" />);
    const el = screen.getByRole("status");
    expect(el).toHaveAttribute("data-slot", "thinking-indicator");
    expect(el).toHaveAttribute("data-variant", "dots");
    expect(el).toHaveAttribute("data-size", "md");
    expect(el).toHaveAttribute("aria-live", "polite");
    expect(el).toHaveClass("custom");
    expect(el).toHaveTextContent("Thinking");
  });

  it.each(["dots", "pulse"] as const)("renders the %s shape", (variant) => {
    const { container } = render(<ThinkingIndicator variant={variant} label="Working" />);
    expect(container.querySelector("[data-slot=thinking-indicator-shape]")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Working");
  });

  it("cycles messages in the text variant and only announces the label", () => {
    vi.useFakeTimers();
    const { container } = render(
      <ThinkingIndicator
        variant="text"
        label="Researching"
        messages={["One…", "Two…"]}
        interval={1000}
      />,
    );
    const text = container.querySelector("[data-slot=thinking-indicator-text]")!;
    expect(text).toHaveAttribute("aria-hidden", "true");
    const active = () => text.querySelector("[data-active=true]")!.textContent;
    expect(active()).toBe("One…");
    act(() => vi.advanceTimersByTime(1000));
    expect(active()).toBe("Two…");
    act(() => vi.advanceTimersByTime(1000));
    expect(active()).toBe("One…");
    vi.useRealTimers();
  });

  it("announces a single message directly", () => {
    const { container } = render(
      <ThinkingIndicator variant="text" messages={["Reading 4 files…"]} />,
    );
    expect(container.querySelector("[data-slot=thinking-indicator-text]")).not.toHaveAttribute(
      "aria-hidden",
    );
    expect(screen.getByRole("status")).toHaveTextContent("Reading 4 files…");
  });

  it("stops loops under reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(<ThinkingIndicator variant="pulse" />);
    for (const bar of container.querySelectorAll("[data-slot=thinking-indicator-shape] > span"))
      expect(bar.className).toContain("motion-reduce:animate-none");
  });

  it("marks busy threads and selects one on click in the composition example", async () => {
    render(<ThinkingIndicatorInThreadList />);
    expect(screen.getAllByRole("status")).toHaveLength(2);
    const churn = screen.getByRole("button", { name: /Q3 churn by cohort/ });
    await userEvent.click(churn);
    expect(churn).toHaveAttribute("aria-current", "page");
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [
      ThinkingIndicatorMinimal,
      ThinkingIndicatorFull,
      ThinkingIndicatorInThreadList,
    ]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
