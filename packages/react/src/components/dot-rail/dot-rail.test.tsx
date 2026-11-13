import { describe, expect, it } from "vitest";
import { axe, render, screen, setReducedMotion } from "../../../test/utils";
import { DotRail } from "./dot-rail";
import { DotRailComposition, DotRailFull, DotRailMinimal, DotRailSpans } from "./dot-rail.examples";

describe("DotRail", () => {
  it("renders a progressbar with data-slot, tone and className", () => {
    render(<DotRail value={0.5} label="Sync" tone="ember" className="custom" />);
    const el = screen.getByRole("progressbar", { name: "Sync" });
    expect(el).toHaveAttribute("data-slot", "dot-rail");
    expect(el).toHaveAttribute("data-tone", "ember");
    expect(el).toHaveAttribute("aria-valuenow", "50");
    expect(el).toHaveClass("custom");
  });

  it("is decorative without a label", () => {
    const { container } = render(<DotRail value={0.3} />);
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("snaps the lit run to whole dots and clamps to the rail", () => {
    const { container, rerender } = render(<DotRail value={0.25} start={0.5} pitch={8} />);
    const lit = container.querySelector<HTMLElement>("[data-slot=dot-rail-lit]")!;
    expect(lit.style.left).toBe("round(down, 50%, 8px)");
    expect(lit.style.width).toBe("round(up, 25%, 8px)");
    // The unlit track is cut to whole dots too.
    expect(lit.parentElement!.style.width).toBe("round(down, 100%, 8px)");
    rerender(<DotRail value={2} start={0.75} label="Over" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
  });

  it("shows a lead dot only while live, and holds it still under reduced motion", () => {
    setReducedMotion(true);
    const { container, rerender } = render(<DotRail value={0.4} />);
    expect(container.querySelector("[data-slot=dot-rail-head]")).toBeNull();
    rerender(<DotRail value={0.4} live />);
    const head = container.querySelector<HTMLElement>("[data-slot=dot-rail-head]")!;
    expect(head.className).toContain("motion-reduce:animate-none");
    // The live dot is the next whole dot after the lit run, at the same size.
    expect(head).toHaveClass("kura-dots");
    expect(head.style.width).toBe("6px");
    expect(head.parentElement).toHaveAttribute("data-slot", "dot-rail-track");
    expect(container.querySelector("[data-slot=dot-rail-lit]")?.className).toContain(
      "motion-reduce:transition-none",
    );
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [DotRailMinimal, DotRailFull, DotRailSpans, DotRailComposition]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
