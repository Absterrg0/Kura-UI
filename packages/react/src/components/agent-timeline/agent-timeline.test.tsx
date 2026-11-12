import { afterEach, describe, expect, it, vi } from "vitest";
import { act, axe, render, screen, setReducedMotion } from "../../../test/utils";
import { AgentTimeline, formatStepDuration } from "./agent-timeline";
import {
  AgentTimelineFull,
  AgentTimelineMinimal,
  AgentTimelineStates,
  AgentTimelineWithTools,
} from "./agent-timeline.examples";

const steps = [
  { id: "a", title: "Read", status: "done" as const, duration: 1200 },
  { id: "b", title: "Edit", status: "active" as const },
  { id: "c", title: "Test", status: "queued" as const },
];

describe("AgentTimeline", () => {
  afterEach(() => vi.useRealTimers());

  it("renders an ordered list of steps with states and data-slot", () => {
    const { container } = render(<AgentTimeline steps={steps} className="custom" />);
    const root = container.querySelector("[data-slot=agent-timeline]")!;
    expect(root).toHaveClass("custom");
    expect(root).toHaveAttribute("data-progress", "1/3");
    const list = screen.getByRole("list", { name: "Agent progress" });
    const items = list.querySelectorAll(":scope > li");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveAttribute("data-status", "done");
    expect(items[1]).toHaveAttribute("aria-current", "step");
    expect(items[1]).toHaveTextContent("Edit (in progress)");
    expect(screen.getByText("1.2s")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Step 2 of 3");
  });

  it("fills connectors behind the agent and leaves the rest empty", () => {
    const { container } = render(<AgentTimeline steps={steps} />);
    const connectors = container.querySelectorAll("[data-slot=agent-timeline-connector]");
    expect(connectors).toHaveLength(2);
    expect(connectors[0]).toHaveAttribute("data-filled", "true");
    expect(connectors[1]).toHaveAttribute("data-filled", "false");
  });

  it("ticks a live timer for the active step and updates as the agent progresses", () => {
    vi.useFakeTimers();
    const { rerender, container } = render(<AgentTimeline steps={steps} />);
    act(() => vi.advanceTimersByTime(3000));
    const active = container.querySelector("li[data-status=active]")!;
    expect(active.querySelector("[data-slot=agent-timeline-duration]")).toHaveTextContent("3.0s");
    rerender(
      <AgentTimeline
        steps={[
          steps[0]!,
          { ...steps[1]!, status: "done", duration: 3000 },
          { ...steps[2]!, status: "done", duration: 500 },
        ]}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("All steps complete");
    expect(container.querySelectorAll("[data-filled=true]")).toHaveLength(2);
  });

  it("renders nested sub-steps and content", () => {
    render(
      <AgentTimeline
        steps={[
          {
            id: "p",
            title: "Plan",
            status: "active",
            content: <span>extra</span>,
            steps: [{ id: "p1", title: "Sub", status: "done" }],
          },
        ]}
      />,
    );
    expect(screen.getAllByRole("list")).toHaveLength(2);
    expect(screen.getByText("extra")).toBeInTheDocument();
  });

  it("formats durations", () => {
    expect(formatStepDuration(450)).toBe("450ms");
    expect(formatStepDuration(1234)).toBe("1.2s");
    expect(formatStepDuration(21_400)).toBe("21s");
    expect(formatStepDuration(83_000)).toBe("1m 23s");
  });

  it("stops the pulse and connector travel under reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(<AgentTimeline steps={steps} />);
    expect(container.innerHTML).toContain("motion-reduce:animate-none");
    expect(container.innerHTML).toContain("motion-reduce:transition-none");
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [
      AgentTimelineMinimal,
      AgentTimelineFull,
      AgentTimelineStates,
      AgentTimelineWithTools,
    ]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
