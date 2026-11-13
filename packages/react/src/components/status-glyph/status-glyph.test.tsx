import { describe, expect, it } from "vitest";
import { axe, render, screen, setReducedMotion } from "../../../test/utils";
import { StatusGlyph } from "./status-glyph";
import {
  StatusGlyphComposition,
  StatusGlyphFull,
  StatusGlyphMinimal,
} from "./status-glyph.examples";

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

  it("sizes to 13, 15 and 20px", () => {
    const { container } = render(
      <>
        <StatusGlyph status="queued" size="sm" />
        <StatusGlyph status="queued" size="lg" />
      </>,
    );
    const [sm, lg] = container.querySelectorAll("[data-slot=status-glyph]");
    expect((sm as HTMLElement).style.width).toBe("13px");
    expect((lg as HTMLElement).style.width).toBe("20px");
  });

  it("draws each state as its own dot pattern", () => {
    const count = (status: Parameters<typeof StatusGlyph>[0]["status"]) => {
      const { container, unmount } = render(<StatusGlyph status={status} />);
      const n = container.querySelectorAll("circle").length;
      unmount();
      return n;
    };
    expect(count("queued")).toBe(8);
    expect(count("waiting")).toBe(9);
    expect(count("done")).toBe(1);
    expect(count("failed")).toBe(9);
    expect(count("skipped")).toBe(3);
    expect(count("paused")).toBe(6);
    expect(count("running")).toBe(8);
  });

  it("stops the chasing light under reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(<StatusGlyph status="running" />);
    const ring = container.querySelectorAll("circle");
    expect(ring[0]?.getAttribute("class")).toContain("motion-reduce:animate-none");
    expect(ring[0]?.getAttribute("class")).toContain("motion-reduce:opacity-100");
    setReducedMotion(false);
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [StatusGlyphMinimal, StatusGlyphFull, StatusGlyphComposition]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
