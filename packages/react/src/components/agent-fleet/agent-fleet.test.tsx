import { describe, expect, it, vi } from "vitest";
import { axe, fireEvent, render, screen, setReducedMotion, userEvent } from "../../../test/utils";
import { AgentFleet, type FleetAgent } from "./agent-fleet";
import {
  AgentFleetCompact,
  AgentFleetComposition,
  AgentFleetEmpty,
  AgentFleetFull,
  AgentFleetMinimal,
} from "./agent-fleet.examples";

const agents: FleetAgent[] = [
  {
    id: "a",
    name: "explorer",
    role: "Maps call sites",
    status: "done",
    startedAt: 0,
    endedAt: 94_000,
    tokens: 84_200,
  },
  { id: "b", name: "test-writer", status: "running", activity: "Rewriting mocks", progress: 0.4 },
  { id: "c", name: "reviewer", status: "waiting", activity: "Needs approval" },
  { id: "d", name: "docs", status: "running" },
];

describe("AgentFleet", () => {
  it("renders the panel, summary and rows with data attributes", () => {
    render(<AgentFleet agents={agents} className="custom" />);
    const root = document.querySelector("[data-slot=agent-fleet]");
    expect(root).toHaveClass("custom");
    expect(root).toHaveAttribute("data-density", "comfortable");
    expect(screen.getByRole("list", { name: /Subagents/ })).toBeInTheDocument();
    expect(document.querySelector("[data-slot=agent-fleet-summary]")).toHaveTextContent(
      "2 running · 1 waiting · 1 done",
    );
    const rows = document.querySelectorAll("[data-slot=agent-fleet-agent]");
    expect(rows).toHaveLength(4);
    expect(rows[0]).toHaveAttribute("data-status", "done");
    // a finished agent shows a duration; only a live one shows a clock
    expect(rows[0]?.querySelector("[data-slot=agent-fleet-elapsed]")).toHaveTextContent("1m 34s");
    expect(rows[0]?.querySelector("[data-slot=agent-fleet-tokens]")).toHaveTextContent("84.2k");
    expect(screen.getByRole("img", { name: "Waiting for you" })).toBeInTheDocument();
  });

  it("is a listbox with click and keyboard selection when onSelect is set", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<AgentFleet agents={agents} onSelect={onSelect} />);
    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveAttribute("tabindex", "0");
    expect(options[1]).toHaveAttribute("tabindex", "-1");
    await user.click(options[1] as HTMLElement);
    expect(onSelect).toHaveBeenLastCalledWith("b");
    expect(options[1]).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(options[1] as HTMLElement, { key: "ArrowDown" });
    expect(options[2]).toHaveFocus();
    fireEvent.keyDown(options[2] as HTMLElement, { key: "End" });
    expect(options[3]).toHaveFocus();
    fireEvent.keyDown(options[3] as HTMLElement, { key: "Enter" });
    expect(onSelect).toHaveBeenLastCalledWith("d");
  });

  it("is controllable", () => {
    const { rerender } = render(<AgentFleet agents={agents} selectedId="a" onSelect={() => {}} />);
    expect(screen.getAllByRole("option")[0]).toHaveAttribute("aria-selected", "true");
    rerender(<AgentFleet agents={agents} selectedId="c" onSelect={() => {}} />);
    expect(screen.getAllByRole("option")[2]).toHaveAttribute("aria-selected", "true");
    expect(screen.getAllByRole("option")[0]).toHaveAttribute("aria-selected", "false");
  });

  it("announces transitions out of running, not ticks", () => {
    const { rerender } = render(<AgentFleet agents={agents} />);
    expect(screen.getByRole("status")).toHaveTextContent("");
    rerender(
      <AgentFleet agents={agents.map((a) => (a.id === "b" ? { ...a, status: "failed" } : a))} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("test-writer failed");
  });

  it("renders compact rows and an empty state", () => {
    const { rerender } = render(<AgentFleet agents={agents} density="compact" />);
    expect(document.querySelector("[data-slot=agent-fleet]")).toHaveAttribute(
      "data-density",
      "compact",
    );
    rerender(<AgentFleet agents={[]} />);
    expect(screen.getByText("No subagents yet")).toBeInTheDocument();
  });

  it("holds the glyph, the rail and its rows still under reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(<AgentFleet agents={agents} />);
    const html = container.innerHTML;
    expect(html).toContain("motion-reduce:animate-none");
    expect(html).toContain("motion-reduce:transition-none");
    setReducedMotion(false);
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [
      AgentFleetMinimal,
      AgentFleetFull,
      AgentFleetCompact,
      AgentFleetEmpty,
      AgentFleetComposition,
    ]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  }, 20_000);
});
