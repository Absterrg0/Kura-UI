import { describe, expect, it, vi } from "vitest";
import {
  axe,
  fireEvent,
  render,
  screen,
  setApplePlatform,
  setReducedMotion,
  userEvent,
} from "../../../test/utils";
import { RunHeader } from "./run-header";
import {
  RunHeaderBar,
  RunHeaderComposition,
  RunHeaderFull,
  RunHeaderMinimal,
} from "./run-header.examples";

const base = { title: "Migrate session API", status: "running" as const };

describe("RunHeader", () => {
  it("renders a region labelled by the title with data attributes", () => {
    render(<RunHeader {...base} className="custom" agent="Kura" model="claude-opus-5-5" />);
    const region = screen.getByRole("region", { name: "Migrate session API" });
    expect(region).toHaveAttribute("data-slot", "run-header");
    expect(region).toHaveAttribute("data-variant", "panel");
    expect(region).toHaveAttribute("data-status", "running");
    expect(region).toHaveClass("custom");
    expect(screen.getByText("claude-opus-5-5")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Run running");
  });

  it("shows elapsed, steps, tokens and spend against budget", () => {
    render(
      <RunHeader
        {...base}
        status="done"
        startedAt={0}
        endedAt={125_000}
        progress={{ done: 7, total: 7 }}
        tokens={{ input: 412_300, output: 38_100 }}
        cost={1.82}
        budget={5}
      />,
    );
    const stats = document.querySelector("[data-slot=run-header-stats]") as HTMLElement;
    expect(stats.querySelector("[data-stat=elapsed] dd")).toHaveTextContent("2:05");
    expect(stats.querySelector("[data-stat=steps] dd")).toHaveTextContent("7 of 7");
    expect(stats.querySelector("[data-stat=tokens] dd")).toHaveTextContent("412k in · 38.1k out");
    expect(stats.querySelector("[data-stat=cost] dd")).toHaveTextContent("$1.82 of $5.00");
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("marks spend over budget in red", () => {
    render(<RunHeader {...base} cost={6.1} budget={5} />);
    expect(screen.getByText("$6.10")).toHaveClass("text-kura-danger-text");
  });

  it("calls onPause / onStop, offers Resume when paused and hides controls when finished", async () => {
    const user = userEvent.setup();
    const onPause = vi.fn();
    const onStop = vi.fn();
    const onResume = vi.fn();
    const { rerender } = render(
      <RunHeader
        {...base}
        onPause={onPause}
        onStop={onStop}
        onResume={onResume}
        shortcuts={false}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Pause run" }));
    await user.click(screen.getByRole("button", { name: /Stop/ }));
    expect(onPause).toHaveBeenCalledOnce();
    expect(onStop).toHaveBeenCalledOnce();
    rerender(
      <RunHeader {...base} status="paused" onPause={onPause} onStop={onStop} onResume={onResume} />,
    );
    await user.click(screen.getByRole("button", { name: "Resume run" }));
    expect(onResume).toHaveBeenCalledOnce();
    rerender(<RunHeader {...base} status="done" onPause={onPause} onStop={onStop} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("binds ⌘. to stop and ⌘⇧P to pause, only when enabled", () => {
    setApplePlatform(true);
    const onStop = vi.fn();
    const onPause = vi.fn();
    const { rerender } = render(<RunHeader {...base} onStop={onStop} onPause={onPause} />);
    fireEvent.keyDown(document, { key: ".", metaKey: true });
    fireEvent.keyDown(document, { key: "P", metaKey: true, shiftKey: true });
    expect(onStop).toHaveBeenCalledOnce();
    expect(onPause).toHaveBeenCalledOnce();
    rerender(<RunHeader {...base} onStop={onStop} onPause={onPause} shortcuts={false} />);
    fireEvent.keyDown(document, { key: ".", metaKey: true });
    expect(onStop).toHaveBeenCalledOnce();
    setApplePlatform(false);
  });

  it("renders the bar variant with visually hidden stat terms", () => {
    render(<RunHeader {...base} variant="bar" startedAt={Date.now()} cost={0.4} />);
    expect(screen.getByRole("region")).toHaveAttribute("data-variant", "bar");
    expect(screen.getByText("Cost")).toHaveClass("sr-only");
    expect(screen.getByText("$0.40")).toBeInTheDocument();
  });

  it("stops the running glyph, step pulse and shimmer under reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(<RunHeader {...base} progress={{ done: 2, total: 5 }} />);
    const html = container.innerHTML;
    expect(html).toContain("motion-reduce:animate-none");
    expect(html).toContain("motion-reduce:transition-none");
    setReducedMotion(false);
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [RunHeaderMinimal, RunHeaderFull, RunHeaderBar, RunHeaderComposition]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  }, 20_000);
});
