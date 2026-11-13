import { describe, expect, it } from "vitest";
import { axe, render, screen, setReducedMotion } from "../../../test/utils";
import { ShimmerText } from "./shimmer-text";
import { ShimmerTextFull, ShimmerTextInMessage, ShimmerTextMinimal } from "./shimmer-text.examples";

describe("ShimmerText", () => {
  it("renders readable text with a data-slot", () => {
    render(<ShimmerText>Thinking…</ShimmerText>);
    const el = screen.getByText("Thinking…");
    expect(el).toHaveAttribute("data-slot", "shimmer-text");
    expect(el).toHaveAttribute("data-active", "true");
    expect(el.tagName).toBe("SPAN");
  });

  it("applies the sweep only while active", () => {
    const { rerender } = render(<ShimmerText>Working</ShimmerText>);
    const el = screen.getByText("Working");
    expect(el.className).toContain("animate-kura-shimmer");
    expect(el.style.backgroundImage).toContain("linear-gradient");
    rerender(<ShimmerText active={false}>Working</ShimmerText>);
    expect(el.className).not.toContain("animate-kura-shimmer");
    expect(el).toHaveAttribute("data-active", "false");
  });

  it("passes through className, as, duration and native props", () => {
    render(
      <ShimmerText as="p" duration={3} className="text-lg" id="s" aria-label="Busy">
        Busy
      </ShimmerText>,
    );
    const el = screen.getByText("Busy");
    expect(el.tagName).toBe("P");
    expect(el).toHaveClass("text-lg");
    expect(el).toHaveAttribute("id", "s");
    expect(el.style.getPropertyValue("--kura-shimmer-duration")).toBe("3s");
  });

  it("disables the animation under reduced motion via motion-reduce classes", () => {
    setReducedMotion(true);
    render(<ShimmerText>Thinking…</ShimmerText>);
    expect(screen.getByText("Thinking…").className).toContain("motion-reduce:animate-none");
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [ShimmerTextMinimal, ShimmerTextFull, ShimmerTextInMessage]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
