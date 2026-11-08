import { describe, expect, it } from "vitest";
import { axe, render, screen, setReducedMotion, userEvent } from "../../../test/utils";
import { Grain } from "./grain";
import { GrainFull, GrainMinimal, GrainOnGradient } from "./grain.examples";

const grain = (c: HTMLElement) => c.querySelector<HTMLElement>("[data-slot=grain]")!;
const layer = (c: HTMLElement) => c.querySelector<HTMLElement>("[data-slot=grain-layer]")!;

describe("Grain", () => {
  it("renders a decorative, non-interactive overlay", () => {
    const { container } = render(<Grain className="custom" />);
    const el = grain(container);
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el).toHaveClass("pointer-events-none", "absolute", "inset-0", "custom");
    expect(el.style.opacity).toBe("0.12");
    expect(el.style.mixBlendMode).toBe("overlay");
    expect(layer(container).style.backgroundImage).toContain("feTurbulence");
  });

  it("applies opacity (clamped), blend and scale", () => {
    const { container, rerender } = render(<Grain opacity={2} blend="multiply" scale={2} />);
    expect(grain(container).style.opacity).toBe("1");
    expect(grain(container).style.mixBlendMode).toBe("multiply");
    expect(layer(container).style.backgroundImage).toContain("baseFrequency='0.425'");
    rerender(<Grain scale={1} />);
    expect(layer(container).style.backgroundImage).toContain("baseFrequency='0.850'");
  });

  it("is static by default and flickers when animated", () => {
    const { container, rerender } = render(<Grain />);
    expect(layer(container).className).not.toContain("animation");
    rerender(<Grain animated fps={8} />);
    expect(grain(container)).toHaveAttribute("data-animated", "true");
    expect(layer(container).style.getPropertyValue("--kura-grain-animation")).toContain("1.000s");
  });

  it("stops the flicker under reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(<Grain animated />);
    expect(layer(container).className).toContain("motion-reduce:animate-none");
  });

  it("switches blend modes in the full example", async () => {
    const { container } = render(<GrainFull />);
    await userEvent.click(screen.getByRole("button", { name: "screen" }));
    expect(grain(container).style.mixBlendMode).toBe("screen");
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [GrainMinimal, GrainFull, GrainOnGradient]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
