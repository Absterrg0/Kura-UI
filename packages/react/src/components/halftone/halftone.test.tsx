import { describe, expect, it } from "vitest";
import { axe, render, screen, setReducedMotion, userEvent } from "../../../test/utils";
import { Halftone } from "./halftone";
import { HalftoneComposition, HalftoneFull, HalftoneMinimal } from "./halftone.examples";

describe("Halftone", () => {
  it("renders a hidden decorative layer with data-slot, tone and className", () => {
    const { container } = render(<Halftone className="custom" />);
    const el = container.querySelector("[data-slot=halftone]")!;
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el).toHaveAttribute("data-tone", "ember");
    expect(el).toHaveAttribute("data-state", "visible");
    expect(el).toHaveClass("custom");
    // a wash and three rings of dots
    expect(el.children).toHaveLength(4);
  });

  it("fades out when not visible, without the fade under reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(<Halftone visible={false} tone="ink" corner="bottom-left" />);
    const el = container.querySelector("[data-slot=halftone]")!;
    expect(el).toHaveAttribute("data-state", "hidden");
    expect(el).toHaveClass("opacity-0");
    expect(el.className).toContain("motion-reduce:transition-none");
    expect((el.children[1] as HTMLElement).style.maskImage).toContain("at 0% 100%");
  });

  it("leaves when the person decides (composition)", async () => {
    const { container } = render(<HalftoneComposition />);
    const el = container.querySelector("[data-slot=halftone]")!;
    expect(el).toHaveAttribute("data-state", "visible");
    await userEvent.click(screen.getByRole("button", { name: "Deploy" }));
    expect(el).toHaveAttribute("data-state", "hidden");
    expect(screen.getByText("Running")).toBeInTheDocument();
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [HalftoneMinimal, HalftoneFull, HalftoneComposition]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
