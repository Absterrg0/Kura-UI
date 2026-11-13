import { describe, expect, it, vi } from "vitest";
import { act, axe, fireEvent, render, screen, setReducedMotion } from "../../../test/utils";
import { AgentOrb } from "./agent-orb";
import {
  AgentOrbFull,
  AgentOrbMinimal,
  AgentOrbStates,
  AgentOrbVoiceSession,
} from "./agent-orb.examples";

describe("AgentOrb", () => {
  it("renders with data-slot, data-state and className", () => {
    const { container } = render(<AgentOrb className="size-40" />);
    const root = container.querySelector("[data-slot=agent-orb]")!;
    expect(root).toHaveAttribute("data-state", "idle");
    expect(root).toHaveClass("aspect-square", "size-40");
    expect(container.querySelector("[data-slot=agent-orb-canvas]")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("announces the state politely and follows state changes", () => {
    const { rerender } = render(<AgentOrb state="listening" />);
    expect(screen.getByRole("status")).toHaveTextContent("Listening");
    rerender(<AgentOrb state="thinking" />);
    expect(screen.getByRole("status")).toHaveTextContent("Thinking");
    rerender(<AgentOrb state="speaking" label="Reading your summary" />);
    expect(screen.getByRole("status")).toHaveTextContent("Reading your summary");
  });

  it("can opt out of the live region", () => {
    render(<AgentOrb state="speaking" announce={false} />);
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByText("Speaking")).toHaveClass("sr-only");
  });

  it("renders a CSS halftone without WebGL, pulsing while thinking", () => {
    const { container, rerender } = render(<AgentOrb state="thinking" />);
    const fallback = container.querySelector("[data-slot=agent-orb-fallback]")!;
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveClass("animate-kura-pulse");
    expect(fallback.querySelectorAll(".kura-dots")).toHaveLength(2);
    rerender(<AgentOrb state="error" />);
    expect(container.querySelector("[data-slot=agent-orb]")).toHaveAttribute("data-state", "error");
    expect(
      container.querySelector<HTMLElement>("[data-slot=agent-orb-fallback]")!.style.color,
    ).toBe("var(--kura-danger-text)");
  });

  it("draws in ink by default and takes a colour and a dot count", () => {
    const { container, rerender } = render(<AgentOrb />);
    const fallback = () => container.querySelector<HTMLElement>("[data-slot=agent-orb-fallback]")!;
    expect(fallback().style.color).toBe("var(--kura-fg)");
    rerender(<AgentOrb color="rebeccapurple" dots={11} />);
    expect(fallback().style.color).toBe("rebeccapurple");
    expect(
      fallback()
        .querySelector<HTMLElement>(".kura-dots")!
        .style.getPropertyValue("--kura-dots-pitch"),
    ).toBe(`${100 / 11}%`);
  });

  it("talks through a turn in the full example", () => {
    vi.useFakeTimers();
    try {
      render(<AgentOrbFull />);
      const orb = () => document.querySelector("[data-slot=agent-orb]");
      expect(orb()).toHaveAttribute("data-state", "idle");
      fireEvent.click(screen.getByRole("button", { name: "Talk" }));
      expect(orb()).toHaveAttribute("data-state", "listening");
      fireEvent.click(screen.getByRole("button", { name: "Done" }));
      expect(orb()).toHaveAttribute("data-state", "thinking");
      act(() => vi.advanceTimersByTime(1600));
      expect(orb()).toHaveAttribute("data-state", "speaking");
      // Interrupting the answer hands the turn back to the person.
      fireEvent.click(screen.getByRole("button", { name: "Interrupt" }));
      expect(orb()).toHaveAttribute("data-state", "listening");
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps state semantics and holds still under reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(<AgentOrb state="thinking" />);
    expect(container.querySelector("[data-slot=agent-orb]")).toHaveAttribute(
      "data-state",
      "thinking",
    );
    expect(container.querySelector("[data-slot=agent-orb-fallback]")!.className).toContain(
      "motion-reduce:animate-none",
    );
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [AgentOrbMinimal, AgentOrbFull, AgentOrbStates, AgentOrbVoiceSession]) {
      const { container, unmount } = render(<Example />);
      await act(async () => {});
      await axe(container);
      unmount();
    }
  });
});
