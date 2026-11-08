import { describe, expect, it, vi } from "vitest";
import { axe, render, screen, setReducedMotion, userEvent } from "../../../test/utils";
import { Aurora } from "./aurora";
import { AuroraFull, AuroraMinimal, AuroraSignIn } from "./aurora.examples";

describe("Aurora", () => {
  it("renders a root with data-slot, children and className", () => {
    render(
      <Aurora data-testid="a" className="h-40">
        <p>Welcome back</p>
      </Aurora>,
    );
    const root = screen.getByTestId("a");
    expect(root).toHaveAttribute("data-slot", "aurora");
    expect(root).toHaveAttribute("data-state", "animating");
    expect(root).toHaveClass("relative", "isolate", "h-40");
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
  });

  it("shows a CSS fallback built from the palette when WebGL is unavailable", () => {
    const { container } = render(<Aurora colors={["red", "green", "blue"]} />);
    const fb = container.querySelector<HTMLElement>("[data-slot=aurora-fallback]")!;
    expect(fb).toBeInTheDocument();
    expect(fb.style.background).toContain("red");
    expect(container.querySelector("[data-slot=aurora-canvas]")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("is still when paused and under reduced motion", () => {
    const { rerender } = render(<Aurora data-testid="a" paused />);
    expect(screen.getByTestId("a")).toHaveAttribute("data-state", "still");
    setReducedMotion(true);
    rerender(<Aurora data-testid="a" />);
    expect(screen.getByTestId("a")).toHaveAttribute("data-state", "still");
  });

  it("forwards refs", () => {
    const ref = vi.fn();
    render(<Aurora ref={ref} />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement));
  });

  it("switches presets and pauses in the full example", async () => {
    const { container } = render(<AuroraFull />);
    await userEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(container.querySelector("[data-slot=aurora]")).toHaveAttribute("data-state", "still");
    await userEvent.click(screen.getByRole("button", { name: "matcha" }));
    expect(screen.getByRole("button", { name: "matcha" })).toHaveAttribute("aria-pressed", "true");
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [AuroraMinimal, AuroraFull, AuroraSignIn]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
