import { describe, expect, it, vi } from "vitest";
import { act, axe, render, screen, setReducedMotion, userEvent } from "../../../test/utils";
import { ParticleField } from "./particle-field";
import {
  ParticleFieldFull,
  ParticleFieldGenerating,
  ParticleFieldMinimal,
} from "./particle-field.examples";

const root = (c: HTMLElement) => c.querySelector<HTMLElement>("[data-slot=particle-field]")!;

describe("ParticleField", () => {
  it("renders a root with data-slot, children and className", () => {
    const { container } = render(
      <ParticleField className="h-40">
        <p>Hello</p>
      </ParticleField>,
    );
    expect(root(container)).toHaveClass("relative", "isolate", "h-40");
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(container.querySelector("[data-slot=particle-field-canvas]")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("falls back to a static dot grid without canvas 2D (jsdom)", () => {
    const { container } = render(<ParticleField />);
    expect(root(container)).toHaveAttribute("data-state", "fallback");
    expect(container.querySelector("[data-slot=particle-field-fallback]")).toBeInTheDocument();
  });

  it("draws and reports converging/still states when a 2D context exists", () => {
    const ctx = new Proxy({}, { get: () => () => undefined, set: () => true });
    const spy = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockImplementation((() => ctx) as never);
    const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);
    const { container, rerender } = render(<ParticleField count={12} />);
    expect(root(container)).toHaveAttribute("data-state", "drifting");
    rerender(<ParticleField count={12} converge />);
    expect(root(container)).toHaveAttribute("data-state", "converging");
    expect(root(container)).toHaveAttribute("data-converge", "true");
    rerender(<ParticleField count={12} paused />);
    expect(root(container)).toHaveAttribute("data-state", "still");
    spy.mockRestore();
    raf.mockRestore();
  });

  it("prints a halftone screen by default and can switch to a constellation", () => {
    const calls = { arc: 0, lineTo: 0 };
    const ctx = new Proxy(
      {},
      {
        get: (_t, key) => () => {
          if (key === "arc") calls.arc++;
          if (key === "lineTo") calls.lineTo++;
        },
        set: () => true,
      },
    );
    const spy = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockImplementation((() => ctx) as never);
    const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);
    const rect = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue({ width: 200, height: 120, left: 0, top: 0 } as DOMRect);
    const { container, rerender } = render(<ParticleField count={10} paused />);
    expect(root(container)).toHaveAttribute("data-variant", "halftone");
    expect(calls.arc).toBeGreaterThan(0);
    expect(calls.lineTo).toBe(0);
    rerender(<ParticleField count={10} paused variant="constellation" linkDistance={400} />);
    expect(root(container)).toHaveAttribute("data-variant", "constellation");
    expect(calls.lineTo).toBeGreaterThan(0);
    spy.mockRestore();
    raf.mockRestore();
    rect.mockRestore();
  });

  it("renders a still frame under reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(<ParticleField />);
    expect(["still", "fallback"]).toContain(root(container).getAttribute("data-state"));
  });

  it("starts generating from the composition example", async () => {
    const { container } = render(<ParticleFieldGenerating />);
    await userEvent.click(screen.getByRole("button", { name: "Generate" }));
    expect(root(container)).toHaveAttribute("data-converge", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Generating your workspace…");
    await act(async () => {});
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [ParticleFieldMinimal, ParticleFieldFull, ParticleFieldGenerating]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
