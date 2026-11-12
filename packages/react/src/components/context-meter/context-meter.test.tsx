import { afterEach, describe, expect, it, vi } from "vitest";
import {
  axe,
  fireEvent,
  render,
  screen,
  setReducedMotion,
  userEvent,
  waitFor,
} from "../../../test/utils";
import { ContextMeter, formatTokens } from "./context-meter";
import {
  ContextMeterFull,
  ContextMeterInComposer,
  ContextMeterMinimal,
  ContextMeterThresholds,
} from "./context-meter.examples";

const segments = [
  { id: "system", label: "System", tokens: 1000 },
  { id: "history", label: "History", tokens: 9000 },
];

describe("ContextMeter", () => {
  afterEach(() => vi.useRealTimers());

  it("renders a labelled ring with a level and data-slot", () => {
    render(<ContextMeter used={42_000} max={100_000} className="custom" />);
    const meter = screen.getByRole("button", {
      name: "42% context used: 42,000 of 100,000 tokens",
    });
    expect(meter).toHaveAttribute("data-slot", "context-meter");
    expect(meter).toHaveAttribute("data-variant", "ring");
    expect(meter).toHaveAttribute("data-level", "ok");
    expect(meter).toHaveClass("custom");
    expect(meter.querySelector("[data-slot=context-meter-ring]")).not.toBeNull();
  });

  it("switches to warning and danger at the thresholds", () => {
    const { rerender } = render(<ContextMeter used={75} max={100} />);
    expect(screen.getByRole("button")).toHaveAttribute("data-level", "warning");
    expect(screen.getByRole("button")).toHaveAccessibleName(/filling up/);
    rerender(<ContextMeter used={95} max={100} />);
    expect(screen.getByRole("button")).toHaveAttribute("data-level", "danger");
    rerender(<ContextMeter used={95} max={100} dangerAt={0.99} warningAt={0.98} />);
    expect(screen.getByRole("button")).toHaveAttribute("data-level", "ok");
  });

  it("sums segments and shows the breakdown on hover", async () => {
    render(<ContextMeter max={20_000} segments={segments} variant="bar" />);
    const meter = screen.getByRole("button", { name: /10,000 of 20,000/ });
    expect(meter).toHaveTextContent("10k");
    await userEvent.hover(meter);
    await waitFor(() =>
      expect(document.querySelector("[data-slot=context-meter-card]")).not.toBeNull(),
    );
    const card = document.querySelector("[data-slot=context-meter-card]")!;
    expect(card).toHaveTextContent("History");
    expect(card).toHaveTextContent("9k");
    expect(card).toHaveTextContent("45%");
    expect(card.querySelectorAll("[data-slot=context-meter-segment]")).toHaveLength(2);
  });

  it("opens the breakdown on click (keyboard and touch)", () => {
    render(<ContextMeter max={20_000} segments={segments} />);
    fireEvent.click(screen.getByRole("button"));
    expect(document.querySelector("[data-slot=context-meter-card]")).not.toBeNull();
  });

  it("formats token counts", () => {
    expect(formatTokens(980)).toBe("980");
    expect(formatTokens(84_210)).toBe("84.2k");
    expect(formatTokens(128_000)).toBe("128k");
    expect(formatTokens(1_000_000)).toBe("1M");
    expect(formatTokens(2_500_000)).toBe("2.5M");
  });

  it("jumps to new values without rolling under reduced motion", () => {
    setReducedMotion(true);
    const { rerender } = render(<ContextMeter used={10} max={100} />);
    rerender(<ContextMeter used={60} max={100} />);
    expect(screen.getByRole("button")).toHaveTextContent("60%");
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [
      ContextMeterMinimal,
      ContextMeterFull,
      ContextMeterThresholds,
      ContextMeterInComposer,
    ]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  }, 20_000);
});
