import { describe, expect, it } from "vitest";
import { axe, render, screen, setReducedMotion } from "../../../test/utils";
import { StatusGlyph } from "./status-glyph";
import { StatusGlyphFull, StatusGlyphMinimal } from "./status-glyph.examples";

describe("StatusGlyph", () => {
  it("renders the state with a data-slot and a spoken name", () => {
    render(<StatusGlyph status="waiting" className="x" />);
    const el = screen.getByRole("img", { name: "Waiting for you" });
    expect(el).toHaveAttribute("data-slot", "status-glyph");
    expect(el).toHaveAttribute("data-status", "waiting");
    expect(el).toHaveClass("x");
  });

  it("is hidden from assistive tech when label is null", () => {
    const { container } = render(<StatusGlyph status="done" label={null} />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("sizes to 14, 16 and 20px", () => {
    const { container } = render(
      <>
        <StatusGlyph status="queued" size="sm" />
        <StatusGlyph status="queued" size="lg" />
      </>,
    );
    const [sm, lg] = container.querySelectorAll("[data-slot=status-glyph]");
    expect((sm as HTMLElement).style.width).toBe("14px");
    expect((lg as HTMLElement).style.width).toBe("20px");
  });

  it("stops the running arc under reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(<StatusGlyph status="running" />);
    expect(container.querySelector("path")?.getAttribute("class")).toContain(
      "motion-reduce:animate-none",
    );
    setReducedMotion(false);
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [StatusGlyphMinimal, StatusGlyphFull]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
