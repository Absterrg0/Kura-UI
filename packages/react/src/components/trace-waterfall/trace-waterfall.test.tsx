import { afterEach, describe, expect, it, vi } from "vitest";
import { act, axe, render, screen, setReducedMotion, userEvent } from "../../../test/utils";
import { formatTick, niceStep, type TraceSpan, TraceWaterfall } from "./trace-waterfall";
import {
  TraceWaterfallCustomDetails,
  TraceWaterfallFull,
  TraceWaterfallLive,
  TraceWaterfallMinimal,
} from "./trace-waterfall.examples";

const spans: TraceSpan[] = [
  {
    id: "root",
    name: "Kura",
    kind: "agent",
    start: 0,
    end: 10_000,
    status: "done",
    children: [
      {
        id: "llm",
        name: "Plan",
        kind: "llm",
        start: 0,
        end: 4_000,
        status: "done",
        tokens: { input: 1000, output: 200 },
        cost: 0.02,
        input: "the prompt",
        output: "the plan",
      },
      {
        id: "sub",
        name: "explorer",
        kind: "agent",
        start: 4_000,
        end: 9_000,
        status: "done",
        children: [
          {
            id: "grep",
            name: "bash",
            kind: "tool",
            meta: "rg x",
            start: 4_100,
            end: 5_000,
            status: "failed",
            error: "boom",
          },
        ],
      },
    ],
  },
];

describe("TraceWaterfall", () => {
  afterEach(() => vi.useRealTimers());

  it("renders a tree on a shared axis with data-slots", () => {
    const { container } = render(<TraceWaterfall spans={spans} className="custom" />);
    const root = container.querySelector("[data-slot=trace-waterfall]")!;
    expect(root).toHaveClass("custom");
    expect(screen.getByRole("tree", { name: "Trace" })).toBeInTheDocument();
    const items = screen.getAllByRole("treeitem");
    expect(items).toHaveLength(4);
    expect(items[0]).toHaveAttribute("aria-level", "1");
    expect(items[3]).toHaveAttribute("aria-level", "3");
    expect(items[3]).toHaveAccessibleName("bash rg x 900ms, tool, failed");
    const bar = items[1]!.querySelector<HTMLElement>("[data-slot=trace-waterfall-bar]")!;
    // A span is a run of lit dots, snapped to whole dots on the shared axis.
    expect(bar.style.left).toBe("round(down, 0%, 6px)");
    expect(bar).toHaveClass("kura-dots");
    // axis: 10s total → 2s ticks up to 12s; with seven ticks every other one is labelled
    expect(container.querySelector("[data-slot=trace-waterfall-axis]")).toHaveTextContent(
      "0" + "4s8s12s",
    );
    expect(screen.getByText("4 spans")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("1 span failed");
  });

  it("selects with the mouse and shows details (uncontrolled)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TraceWaterfall spans={spans} onSelectedIdChange={onChange} />);
    await user.click(screen.getByText("Plan"));
    expect(onChange).toHaveBeenCalledWith("llm");
    const item = screen.getAllByRole("treeitem")[1]!;
    expect(item).toHaveAttribute("aria-selected", "true");
    expect(item).toHaveTextContent("the prompt");
    expect(item).toHaveTextContent("1.0k in");
    await user.click(screen.getByText("Plan"));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("supports controlled selection", () => {
    const { rerender } = render(<TraceWaterfall spans={spans} selectedId="grep" />);
    expect(screen.getByText("boom")).toBeInTheDocument();
    rerender(<TraceWaterfall spans={spans} selectedId={null} />);
    expect(screen.queryByText("boom")).not.toBeInTheDocument();
  });

  it("navigates the tree with the keyboard", async () => {
    const user = userEvent.setup();
    render(<TraceWaterfall spans={spans} />);
    const items = () => screen.getAllByRole("treeitem");
    await user.tab();
    expect(items()[0]).toHaveFocus();
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(items()[2]).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(items()[2]).toHaveAttribute("aria-expanded", "false");
    expect(items()).toHaveLength(3);
    await user.keyboard("{ArrowRight}");
    expect(items()).toHaveLength(4);
    await user.keyboard("{ArrowRight}");
    expect(items()[3]).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(items()[2]).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(items()[2]).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{Escape}");
    expect(items()[2]).toHaveAttribute("aria-selected", "false");
    await user.keyboard("{End}");
    expect(items()[3]).toHaveFocus();
    await user.keyboard("{Home}");
    expect(items()[0]).toHaveFocus();
  });

  it("collapses subtrees by default and by clicking the chevron", async () => {
    const user = userEvent.setup();
    const { container } = render(<TraceWaterfall spans={spans} defaultCollapsedIds={["sub"]} />);
    expect(screen.getAllByRole("treeitem")).toHaveLength(3);
    const toggles = container.querySelectorAll("[data-slot=trace-waterfall-toggle]");
    await user.click(toggles[1]!);
    expect(screen.getAllByRole("treeitem")).toHaveLength(4);
  });

  it("grows running spans live from startedAt", () => {
    vi.useFakeTimers();
    const startedAt = Date.now() - 5_000;
    render(
      <TraceWaterfall
        startedAt={startedAt}
        spans={[{ id: "r", name: "Kura", kind: "agent", start: 0, status: "running" }]}
      />,
    );
    act(() => vi.advanceTimersByTime(1_000));
    const item = screen.getByRole("treeitem");
    expect(item.querySelector("[data-slot=trace-waterfall-duration]")).toHaveTextContent("6.0s");
    expect(document.querySelector("[data-slot=trace-waterfall-now]")).toBeInTheDocument();
  });

  it("formats ticks and picks nice steps", () => {
    expect(niceStep(10_000)).toBe(2_000);
    expect(niceStep(712_000)).toBe(120_000);
    expect(formatTick(0)).toBe("0");
    expect(formatTick(250)).toBe("250ms");
    expect(formatTick(1_500)).toBe("1.5s");
    expect(formatTick(150_000)).toBe("2m 30s");
  });

  it("renders an empty state", () => {
    render(<TraceWaterfall spans={[]} />);
    expect(screen.getByText("No spans yet")).toBeInTheDocument();
  });

  it("stops easing under reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(<TraceWaterfall spans={spans} />);
    expect(container.innerHTML).toContain("motion-reduce:transition-none");
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [
      TraceWaterfallMinimal,
      TraceWaterfallFull,
      TraceWaterfallLive,
      TraceWaterfallCustomDetails,
    ]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
