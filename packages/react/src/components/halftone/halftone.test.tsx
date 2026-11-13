import { describe, expect, it } from "vitest";
import { axe, render, screen, setReducedMotion, userEvent } from "../../../test/utils";
import { Halftone, halftonePath } from "./halftone";
import { HalftoneComposition, HalftoneFull, HalftoneMinimal } from "./halftone.examples";

/** Every dot in a path, as [x, y, r]. */
function dots(d: string) {
  return [...d.matchAll(/M([\d.-]+) ([\d.-]+)a([\d.]+)/g)].map(([, x, y, r]) => {
    const radius = Number(r);
    return [Number(x) + radius, Number(y), radius] as const;
  });
}

describe("Halftone", () => {
  it("renders a hidden decorative layer with data-slot and className", () => {
    const { container } = render(<Halftone className="custom" />);
    const el = container.querySelector("[data-slot=halftone]")!;
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el).toHaveAttribute("data-state", "visible");
    expect(el).toHaveClass("custom", "absolute", "-z-10");
    // jsdom has no layout: with nothing measured it draws nothing and waits, faded.
    expect(el.querySelector("svg")).toBeNull();
    expect(el).toHaveClass("opacity-0");
  });

  it("draws whole dots that shrink away from the top-right corner", () => {
    const all = dots(halftonePath(384, 128, 0.62, 14));
    expect(all.length).toBeGreaterThan(40);
    for (const [x, y, r] of all) {
      // Inside the box: never cut by its edge.
      expect(x - r).toBeGreaterThanOrEqual(0);
      expect(x + r).toBeLessThanOrEqual(384);
      expect(y - r).toBeGreaterThanOrEqual(0);
      expect(y + r).toBeLessThanOrEqual(128);
      // Inside the rounded corner too.
      if (x > 384 - 14 && y < 14) expect(Math.hypot(x - 370, y - 14) + r).toBeLessThan(14);
      // One grid, quarter-pixel radii.
      expect((r * 4) % 1).toBe(0);
    }
    const near = all.find(([x, y]) => x === 384 - 13.5 && y === 6.5)!;
    const far = all.reduce((a, b) => (b[0] < a[0] ? b : a));
    expect(near[2]).toBeGreaterThan(far[2]);
    // A smaller reach covers less of the box.
    expect(dots(halftonePath(384, 128, 0.4, 14)).length).toBeLessThan(all.length);
  });

  it("fades out when not visible, and keeps that fade under reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(<Halftone visible={false} reach={0.4} />);
    const el = container.querySelector("[data-slot=halftone]")!;
    expect(el).toHaveAttribute("data-state", "hidden");
    expect(el).toHaveClass("opacity-0");
    // An opacity fade is not travel, so reduced motion leaves it alone.
    expect(el.className).toContain("transition-opacity");
    expect(el.className).not.toContain("motion-reduce:transition-none");
  });

  it("leaves when the person decides", async () => {
    const { container } = render(<HalftoneFull />);
    const el = container.querySelector("[data-slot=halftone]")!;
    expect(el).toHaveAttribute("data-state", "visible");
    expect(screen.getByText("Needs you")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Deploy" }));
    expect(el).toHaveAttribute("data-state", "hidden");
    expect(screen.getByText("Deploying")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Deny" })).toBeDisabled();
  });

  it("leaves a run panel once the waiting agent is approved (composition)", async () => {
    const { container } = render(<HalftoneComposition />);
    expect(container.querySelector("[data-status=waiting]")).not.toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(container.querySelector("[data-slot=halftone]")).toHaveAttribute("data-state", "hidden");
    expect(container.querySelector("[data-status=waiting]")).toBeNull();
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [HalftoneMinimal, HalftoneFull, HalftoneComposition]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
