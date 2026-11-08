import { describe, expect, it } from "vitest";
import { axe, render, screen, setReducedMotion, userEvent } from "../../../test/utils";
import { BorderBeam } from "./border-beam";
import { BorderBeamAgentTask, BorderBeamFull, BorderBeamMinimal } from "./border-beam.examples";

const beam = (c: HTMLElement) => c.querySelector<HTMLElement>("[data-slot=border-beam]")!;

describe("BorderBeam", () => {
  it("renders a decorative overlay with data-slot and inherits the radius", () => {
    const { container } = render(
      <div className="relative rounded-kura-xl">
        <BorderBeam className="custom" />
      </div>,
    );
    const el = beam(container);
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el).toHaveAttribute("data-active", "true");
    expect(el).toHaveClass(
      "absolute",
      "inset-0",
      "rounded-[inherit]",
      "pointer-events-none",
      "custom",
    );
    expect(container.querySelectorAll("[data-slot=border-beam-ring]")).toHaveLength(1);
  });

  it("maps props to CSS variables", () => {
    const { container } = render(
      <BorderBeam duration={4} width={2} offset={0.5} reverse colors={["transparent", "red"]} />,
    );
    const style = beam(container).style;
    expect(style.getPropertyValue("--kura-beam-duration")).toBe("4s");
    expect(style.getPropertyValue("--kura-beam-width")).toBe("2px");
    expect(style.getPropertyValue("--kura-beam-delay")).toBe("-2s");
    expect(style.getPropertyValue("--kura-beam-direction")).toBe("reverse");
    expect(style.getPropertyValue("--kura-beam-stops")).toContain("red 356.00deg");
  });

  it("fades out and pauses when inactive, and adds a glow layer on request", () => {
    const { container, rerender } = render(<BorderBeam glow />);
    expect(container.querySelector("[data-slot=border-beam-glow]")).toBeInTheDocument();
    rerender(<BorderBeam glow active={false} />);
    expect(beam(container)).toHaveClass("opacity-0");
    expect(beam(container).style.getPropertyValue("--kura-beam-play")).toBe("paused");
  });

  it("toggles from the full example", async () => {
    const { container } = render(<BorderBeamFull />);
    await userEvent.click(screen.getByRole("button", { name: "Stop" }));
    for (const el of container.querySelectorAll("[data-slot=border-beam]"))
      expect(el).toHaveAttribute("data-active", "false");
  });

  it("swaps travel for a static ring under reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(<BorderBeam />);
    expect(beam(container).style.getPropertyValue("--kura-beam-static")).toContain("color-mix");
    expect(document.head.innerHTML + container.innerHTML).toContain("prefers-reduced-motion");
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [BorderBeamMinimal, BorderBeamFull, BorderBeamAgentTask]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
