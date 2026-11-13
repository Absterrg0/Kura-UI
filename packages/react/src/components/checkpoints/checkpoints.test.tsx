import { createAgent } from "@ui-sdk/react/agent";
import { describe, expect, it, vi } from "vitest";
import {
  act,
  axe,
  render,
  screen,
  setReducedMotion,
  userEvent,
  waitFor,
} from "../../../test/utils";
import { type Checkpoint, Checkpoints } from "./checkpoints";
import {
  CheckpointsComposition,
  CheckpointsEmpty,
  CheckpointsFull,
  CheckpointsMinimal,
  CheckpointsRestored,
} from "./checkpoints.examples";

const now = Date.now();
const list: Checkpoint[] = [
  { id: "c4", label: "Fixed refresh", at: now - 30_000, filesChanged: 1, kind: "auto" },
  {
    id: "c3",
    label: "Updated tests",
    at: now - 180_000,
    filesChanged: 3,
    kind: "auto",
    current: true,
  },
  { id: "c2", label: "Before middleware", at: now - 360_000, kind: "manual" },
  { id: "c1", label: "Run started", at: now - 720_000, kind: "auto" },
];

describe("Checkpoints", () => {
  it("renders an ordered list with current, undone and kinds", () => {
    render(<Checkpoints checkpoints={list} className="custom" />);
    const root = document.querySelector("[data-slot=checkpoints]");
    expect(root).toHaveClass("custom");
    expect(screen.getByRole("list", { name: /Checkpoints/ })).toBeInTheDocument();
    const items = document.querySelectorAll("[data-slot=checkpoints-item]");
    expect(items[0]).toHaveAttribute("data-ahead", "true");
    expect(items[1]).toHaveAttribute("data-current", "true");
    expect(items[2]).toHaveAttribute("data-kind", "manual");
    expect(screen.getByText("(current)")).toBeInTheDocument();
    expect(screen.getByText("3 files")).toBeInTheDocument();
    expect(screen.getByText("3m ago")).toBeInTheDocument();
    expect(screen.getByText("(undone)")).toBeInTheDocument();
  });

  it("renders no Restore without onRestore, and none for the current checkpoint", () => {
    const { rerender } = render(<Checkpoints checkpoints={list} />);
    expect(screen.queryByRole("button", { name: /Restore/ })).toBeNull();
    rerender(<Checkpoints checkpoints={list} onRestore={() => {}} />);
    expect(screen.getAllByRole("button", { name: /^Restore to/ })).toHaveLength(3);
    expect(screen.queryByRole("button", { name: "Restore to Updated tests" })).toBeNull();
  });

  it("confirms inline, then restores and announces", async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn(() => Promise.resolve());
    render(<Checkpoints checkpoints={list} onRestore={onRestore} />);
    const trigger = screen.getByRole("button", { name: "Restore to Before middleware" });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const group = screen.getByRole("group", { name: "Restore to Before middleware" });
    expect(group).toHaveTextContent("Edits from 1 later checkpoint are undone");
    const confirm = screen.getByRole("button", { name: "Restore" });
    expect(confirm).toHaveFocus();
    await user.click(confirm);
    expect(onRestore).toHaveBeenCalledWith("c2");
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Restored to “Before middleware”"),
    );
  });

  it("describes restoring forward to an undone checkpoint", async () => {
    const user = userEvent.setup();
    render(<Checkpoints checkpoints={list} onRestore={() => {}} />);
    await user.click(screen.getByRole("button", { name: "Restore to Fixed refresh" }));
    expect(screen.getByRole("group")).toHaveTextContent("Re-applies edits from 1 checkpoint");
  });

  it("cancels with Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();
    render(<Checkpoints checkpoints={list} onRestore={onRestore} />);
    const trigger = screen.getByRole("button", { name: "Restore to Run started" });
    await user.click(trigger);
    await user.keyboard("{Escape}");
    await act(() => new Promise((r) => requestAnimationFrame(() => r(null))));
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
    expect(onRestore).not.toHaveBeenCalled();
  });

  it("restores directly with confirm={false} and offers Save checkpoint", async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();
    const onCreate = vi.fn();
    render(
      <Checkpoints checkpoints={list} confirm={false} onRestore={onRestore} onCreate={onCreate} />,
    );
    await user.click(screen.getByRole("button", { name: "Restore to Run started" }));
    expect(onRestore).toHaveBeenCalledWith("c1");
    await user.click(screen.getByRole("button", { name: "Save checkpoint" }));
    expect(onCreate).toHaveBeenCalledOnce();
  });

  it("an agent can read the checkpoints, but restoring waits for the person", async () => {
    let personSaysYes = false;
    const agent = createAgent({ allow: (step) => !step.confirm || personSaysYes });
    const onRestore = vi.fn();
    render(<Checkpoints checkpoints={list} onRestore={onRestore} />);
    const entry = agent.snapshot().find((e) => e.component === "checkpoints-list");
    expect(entry?.label).toBe("Checkpoints");
    expect(entry?.value).toBe("At “Updated tests”");
    expect(entry?.actions).toEqual(["restore"]);
    expect(entry?.confirm).toMatch(/Restores the workspace/);

    const step = {
      steps: [{ ref: "Checkpoints", action: "restore", args: ["Before middleware"] }],
    };
    expect((await agent.act(step)).ok).toBe(false);
    expect(onRestore).not.toHaveBeenCalled();
    personSaysYes = true;
    const result = await agent.act(step);
    expect(result.ok, result.error?.message).toBe(true);
    expect(onRestore).toHaveBeenCalledWith("c2");
  });

  it("shows an empty state", () => {
    render(<Checkpoints checkpoints={[]} />);
    expect(screen.getByText("No checkpoints yet")).toBeInTheDocument();
  });

  it("opens the confirm without travel under reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(<Checkpoints checkpoints={list} onRestore={() => {}} />);
    expect(container.innerHTML).toContain("motion-reduce:transition-opacity");
    setReducedMotion(false);
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [
      CheckpointsMinimal,
      CheckpointsFull,
      CheckpointsRestored,
      CheckpointsEmpty,
      CheckpointsComposition,
    ]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  }, 20_000);
});
