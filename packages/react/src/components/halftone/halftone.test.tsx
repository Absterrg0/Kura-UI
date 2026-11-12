import { describe, expect, it } from "vitest";
import { axe, render, screen, setReducedMotion, userEvent } from "../../../test/utils";
import { Halftone } from "./halftone";
import { HalftoneComposition, HalftoneFull, HalftoneMinimal } from "./halftone.examples";

describe("Halftone", () => {
  it("renders a hidden decorative layer with data-slot and className", () => {
    const { container } = render(<Halftone className="custom" />);
    const el = container.querySelector("[data-slot=halftone]")!;
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el).toHaveAttribute("data-state", "visible");
    expect(el).toHaveClass("custom");
    // three sizes of dot and nothing else: no wash
    expect(el.children).toHaveLength(3);
    expect((el.children[0] as HTMLElement).style.maskImage).toContain("at 100% 0%");
  });

  it("fades out when not visible, without the fade under reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(<Halftone visible={false} reach={0.4} />);
    const el = container.querySelector("[data-slot=halftone]")!;
    expect(el).toHaveAttribute("data-state", "hidden");
    expect(el).toHaveClass("opacity-0");
    expect(el.className).toContain("motion-reduce:transition-none");
    expect((el.children[1] as HTMLElement).style.maskImage).toContain("40% 57%");
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
