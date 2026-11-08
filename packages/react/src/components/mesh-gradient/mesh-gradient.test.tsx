import { describe, expect, it, vi } from "vitest";
import { axe, fireEvent, render, screen, setReducedMotion } from "../../../test/utils";
import { MeshGradient } from "./mesh-gradient";
import { MeshGradientFull, MeshGradientHero, MeshGradientMinimal } from "./mesh-gradient.examples";
import { linearToOklab, oklabToLinear, parseColor } from "./shader-color";

describe("MeshGradient", () => {
  it("renders a root with data-slot, children on top and className last", () => {
    render(
      <MeshGradient className="h-40" data-testid="mg">
        <h2>Hello</h2>
      </MeshGradient>,
    );
    const root = screen.getByTestId("mg");
    expect(root).toHaveAttribute("data-slot", "mesh-gradient");
    expect(root).toHaveAttribute("data-state", "animating");
    expect(root).toHaveClass("relative", "isolate", "h-40");
    expect(screen.getByRole("heading", { name: "Hello" })).toBeInTheDocument();
  });

  it("falls back to a CSS gradient built from the colours when WebGL is unavailable", () => {
    const { container } = render(<MeshGradient colors={["#ff0000", "oklch(0.7 0.1 200)"]} />);
    const fallback = container.querySelector<HTMLElement>("[data-slot=mesh-gradient-fallback]");
    expect(fallback).toBeInTheDocument();
    expect(fallback!.style.background).toContain("radial-gradient");
    expect(container.querySelector("[data-slot=mesh-gradient-canvas]")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("reports a still state when paused or speed is 0", () => {
    const { rerender } = render(<MeshGradient data-testid="mg" paused />);
    expect(screen.getByTestId("mg")).toHaveAttribute("data-state", "still");
    rerender(<MeshGradient data-testid="mg" speed={0} />);
    expect(screen.getByTestId("mg")).toHaveAttribute("data-state", "still");
  });

  it("renders a still frame under reduced motion", () => {
    setReducedMotion(true);
    render(<MeshGradient data-testid="mg" />);
    expect(screen.getByTestId("mg")).toHaveAttribute("data-state", "still");
  });

  it("forwards refs and tolerates pointer movement", () => {
    const ref = vi.fn();
    render(<MeshGradient ref={ref} />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement));
    fireEvent.pointerMove(window, { clientX: 10, clientY: 10 });
  });

  it("switches presets from the full example", async () => {
    render(<MeshGradientFull />);
    const dusk = screen.getByRole("button", { name: "dusk" });
    fireEvent.click(dusk);
    expect(dusk).toHaveAttribute("aria-pressed", "true");
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [MeshGradientMinimal, MeshGradientFull, MeshGradientHero]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});

describe("shader colour parsing", () => {
  it("parses hex, rgb and oklch into linear RGB", () => {
    expect(parseColor("#ffffff")?.linear).toEqual([1, 1, 1]);
    expect(parseColor("rgb(0 0 0 / 0.5)")).toEqual({ linear: [0, 0, 0], alpha: 0.5 });
    const jade = parseColor("oklch(0.55 0.115 172)")!;
    expect(jade.linear[1]).toBeGreaterThan(jade.linear[0]);
    expect(parseColor("var(--x)")).toBeNull();
  });

  it("round-trips OKLab", () => {
    const lab = linearToOklab([0.2, 0.5, 0.3]);
    const back = oklabToLinear(lab);
    expect(back[0]).toBeCloseTo(0.2, 4);
    expect(back[1]).toBeCloseTo(0.5, 4);
  });
});
