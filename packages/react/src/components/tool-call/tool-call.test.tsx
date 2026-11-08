import { afterEach, describe, expect, it, vi } from "vitest";
import { act, axe, render, screen, setReducedMotion, userEvent } from "../../../test/utils";
import { formatDuration, ToolCall } from "./tool-call";
import {
  ToolCallApproval,
  ToolCallFull,
  ToolCallInline,
  ToolCallMinimal,
  ToolCallStates,
} from "./tool-call.examples";

describe("ToolCall", () => {
  afterEach(() => vi.useRealTimers());

  it("renders name, status, summary and data-slot", () => {
    const { container } = render(
      <ToolCall name="read_file" status="success" duration={182} args={{ path: "a.ts" }} />,
    );
    const root = container.querySelector("[data-slot=tool-call]")!;
    expect(root).toHaveAttribute("data-status", "success");
    expect(root).toHaveAttribute("data-variant", "card");
    expect(root).toHaveAttribute("data-state", "closed");
    expect(screen.getByText("read_file")).toBeInTheDocument();
    expect(screen.getByText("a.ts")).toBeInTheDocument();
    expect(screen.getByText("180ms")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("read_file Completed");
  });

  it("expands to show pretty-printed args and result", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <ToolCall
        name="search"
        status="success"
        args={{ q: "x", n: 2 }}
        result={{ ok: true }}
        onOpenChange={onOpenChange}
      />,
    );
    const trigger = screen.getByRole("button", { name: /search/ });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(onOpenChange).toHaveBeenCalledWith(true);
    const details = document.querySelector("[data-slot=tool-call-details]")!;
    expect(details).not.toHaveAttribute("inert");
    expect(details.textContent).toContain('"n": 2');
    expect(screen.getByRole("region", { name: "Result code" })).toHaveTextContent('"ok": true');
  });

  it("ticks while running and freezes the measured duration", () => {
    vi.useFakeTimers();
    const { rerender, container } = render(<ToolCall name="t" status="running" />);
    expect(container.querySelector("[data-slot=shimmer-text]")).not.toBeNull();
    act(() => vi.advanceTimersByTime(1500));
    expect(container.querySelector("[data-slot=tool-call-elapsed]")).toHaveTextContent("1.5s");
    rerender(<ToolCall name="t" status="success" />);
    act(() => vi.advanceTimersByTime(3000));
    expect(container.querySelector("[data-slot=tool-call-elapsed]")).toHaveTextContent("1.5s");
  });

  it("opens errors by default and shows the message", () => {
    render(<ToolCall name="deploy" status="error" args={{}} error="boom" />);
    expect(screen.getByRole("button", { name: /deploy/ })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("boom")).toBeInTheDocument();
  });

  it("renders actions and has no toggle without details", () => {
    render(
      <ToolCall
        name="noop"
        status="awaiting-approval"
        actions={<button type="button">Approve</button>}
      />,
    );
    expect(screen.queryByRole("button", { name: /noop/ })).toBeNull();
    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
  });

  it("formats durations", () => {
    expect(formatDuration(42)).toBe("40ms");
    expect(formatDuration(1530)).toBe("1.5s");
    expect(formatDuration(65_000)).toBe("1m 5s");
  });

  it("stops the running pulse under reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(<ToolCall name="t" status="running" />);
    expect(container.querySelector("[data-slot=tool-call-status] span")!.className).toContain(
      "motion-reduce:animate-none",
    );
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [
      ToolCallMinimal,
      ToolCallFull,
      ToolCallStates,
      ToolCallInline,
      ToolCallApproval,
    ]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
