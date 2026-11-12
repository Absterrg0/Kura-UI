import { afterEach, describe, expect, it, vi } from "vitest";
import { act, axe, render, screen, setReducedMotion, userEvent } from "../../../test/utils";
import { TaskList, type TaskListItem } from "./task-list";
import {
  TaskListComposition,
  TaskListFull,
  TaskListMinimal,
  TaskListStates,
} from "./task-list.examples";

const items: TaskListItem[] = [
  { id: "a", title: "Read routes", status: "done", durationMs: 21_400 },
  { id: "b", title: "Map call sites", status: "done", durationMs: 48_200 },
  { id: "b2", title: "Patch middleware", status: "skipped" },
  { id: "c", title: "Patch client", status: "running" },
  {
    id: "d",
    title: "Run tests",
    status: "failed",
    detail: "expected 200, received 401",
    children: [{ id: "d1", title: "login.test.ts", status: "done" }],
  },
  { id: "e", title: "Open PR", status: "queued" },
];

describe("TaskList", () => {
  afterEach(() => vi.useRealTimers());

  it("renders data-slot, header progress and statuses", () => {
    const { container } = render(<TaskList items={items} className="custom" />);
    const root = container.querySelector("[data-slot=task-list]")!;
    expect(root).toHaveClass("custom");
    expect(root).toHaveAttribute("data-progress", "3/6");
    expect(screen.getByText("3 of 6")).toBeInTheDocument();
    // Progress is a rail of dots; a step in hand counts as half.
    const rail = container.querySelector<HTMLElement>("[data-slot=task-list-progress]")!;
    expect(rail.querySelector<HTMLElement>("[data-slot=dot-rail-lit]")?.style.width).toMatch(
      /^round\(up, 58\.\d+%, 6px\)$/,
    );
    const running = container.querySelector("li[data-status=running]")!;
    expect(running).toHaveAttribute("aria-current", "step");
    expect(running).toHaveTextContent("Patch client (in progress)");
    expect(screen.getByText("expected 200, received 401")).toBeInTheDocument();
    expect(screen.getByText("1/1")).toBeInTheDocument();
  });

  it("folds leading finished items into a Completed group (uncontrolled)", async () => {
    const user = userEvent.setup();
    render(<TaskList items={items} />);
    const toggle = screen.getByRole("button", { name: /Completed/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Read routes").closest("ul")).not.toBeVisible();
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Read routes").closest("ul")).toBeVisible();
  });

  it("supports a controlled Completed group and shows everything when finished", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <TaskList items={items} completedOpen={false} onCompletedOpenChange={onChange} />,
    );
    await user.click(screen.getByRole("button", { name: /Completed/ }));
    expect(onChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole("button", { name: /Completed/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    rerender(<TaskList items={items.map((i) => ({ ...i, status: "done" as const }))} />);
    expect(screen.queryByRole("button", { name: /Completed/ })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("All tasks complete");
  });

  it("selects with the mouse and moves focus with arrow keys", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<TaskList items={items} collapseCompleted={false} selectedId="c" onSelect={onSelect} />);
    const row = screen.getByRole("button", { name: /Patch client/ });
    expect(row).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: /Run tests/ }));
    expect(onSelect).toHaveBeenCalledWith("d", expect.objectContaining({ id: "d" }));
    row.focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("button", { name: /Run tests/ })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("button", { name: /Read routes/ })).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("button", { name: /Open PR/ })).toHaveFocus();
  });

  it("ticks a live timer for the running item", () => {
    vi.useFakeTimers();
    const start = Date.now();
    const { container } = render(
      <TaskList
        items={[{ id: "x", title: "Run", status: "running", startedAt: start - 41_000 }]}
      />,
    );
    act(() => vi.advanceTimersByTime(2000));
    expect(container.querySelector("[data-slot=task-list-duration]")).toHaveTextContent("0:43");
  });

  it("renders an empty state", () => {
    render(<TaskList items={[]} />);
    expect(screen.getByText("No plan yet")).toBeInTheDocument();
  });

  it("stops shimmer and travel under reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(<TaskList items={items} />);
    expect(container.innerHTML).toContain("motion-reduce:animate-none");
    expect(container.innerHTML).toContain("motion-reduce:starting:translate-y-0");
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [TaskListMinimal, TaskListFull, TaskListStates, TaskListComposition]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
