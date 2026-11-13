import { describe, expect, it } from "vitest";
import { axe, render, screen, setReducedMotion } from "../../../test/utils";
import { AgentSigil, agentSigilPattern } from "./agent-sigil";
import { AgentSigilComposition, AgentSigilFull, AgentSigilMinimal } from "./agent-sigil.examples";

describe("AgentSigil", () => {
  it("renders a tile with data-slot, size and className", () => {
    const { container } = render(<AgentSigil name="explorer" size="lg" className="custom" />);
    const el = container.querySelector("[data-slot=agent-sigil]")!;
    expect(el).toHaveAttribute("data-size", "lg");
    expect(el).toHaveClass("custom");
    expect(el).toHaveAttribute("aria-hidden", "true");
  });

  it("draws the same face for the same name, and different faces for different names", () => {
    expect(agentSigilPattern("explorer")).toEqual(agentSigilPattern("explorer"));
    expect(agentSigilPattern("explorer")).not.toEqual(agentSigilPattern("migrator"));
  });

  it("is symmetric and neither sparse nor solid, for any name", () => {
    for (const name of ["a", "Kura", "test-writer", "x".repeat(40), "", "日本語"]) {
      const cells = agentSigilPattern(name);
      expect(cells).toHaveLength(25);
      for (let y = 0; y < 5; y++) {
        expect(cells[y * 5]).toBe(cells[y * 5 + 4]);
        expect(cells[y * 5 + 1]).toBe(cells[y * 5 + 3]);
      }
      const lit = cells.filter(Boolean).length;
      expect(lit).toBeGreaterThanOrEqual(9);
      expect(lit).toBeLessThanOrEqual(16);
    }
  });

  it("draws on a whole-pixel pitch and centres the lit rows", () => {
    const { container } = render(<AgentSigil name="reviewer" size="sm" />);
    const svg = container.querySelector("svg")!;
    // 10px for 15 units: a 2px pitch.
    expect(svg).toHaveAttribute("width", "10");
    const ys = [...svg.querySelectorAll("circle")].map((c) => Number(c.getAttribute("cy")));
    // The lit rows are centred in the 15-unit box.
    expect(Math.min(...ys) + Math.max(...ys)).toBeCloseTo(15);
  });

  it("has a spoken name only when given a label", () => {
    render(<AgentSigil name="Kura" label="Kura, the lead agent" />);
    expect(screen.getByRole("img", { name: "Kura, the lead agent" })).toBeInTheDocument();
  });

  it("can drop the tile, and has nothing to animate under reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(<AgentSigil name="Kura" bare />);
    const el = container.querySelector("[data-slot=agent-sigil]")!;
    expect(el.className).not.toContain("shadow-kura-raised");
    expect(el.className).not.toContain("animate");
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [AgentSigilMinimal, AgentSigilFull, AgentSigilComposition]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
