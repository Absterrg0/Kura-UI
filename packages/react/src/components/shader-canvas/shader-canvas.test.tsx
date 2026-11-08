import { describe, expect, it, vi } from "vitest";
import { axe, render, setReducedMotion } from "../../../test/utils";
import { ShaderCanvas } from "./shader-canvas";
import {
  ShaderCanvasFeatureCard,
  ShaderCanvasFull,
  ShaderCanvasMinimal,
} from "./shader-canvas.examples";

const frag = "void main() { fragColor = vec4(1.0); }";

describe("ShaderCanvas", () => {
  it("renders a decorative container with data-slot", () => {
    const { container } = render(<ShaderCanvas fragmentShader={frag} className="h-10" />);
    const root = container.querySelector("[data-slot=shader-canvas]")!;
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).toHaveClass("h-10");
  });

  it("falls back gracefully when WebGL2 is unavailable (jsdom)", () => {
    const { container } = render(
      <ShaderCanvas fragmentShader={frag} fallback={<div data-testid="fb" />} />,
    );
    expect(container.querySelector("[data-slot=shader-canvas]")).toHaveAttribute(
      "data-state",
      "fallback",
    );
    expect(container.querySelector("[data-testid=fb]")).toBeInTheDocument();
  });

  it("uses the default token fallback when none is given", () => {
    const { container } = render(<ShaderCanvas fragmentShader={frag} />);
    const fb = container.querySelector("[data-slot=shader-canvas-fallback]");
    expect(fb).toBeInTheDocument();
    expect(fb?.className).toContain("var(--kura-accent-subtle)");
    expect(fb?.className).toContain("bg-kura-surface-sunken");
  });

  it("forwards refs", () => {
    const ref = vi.fn();
    render(<ShaderCanvas fragmentShader={frag} ref={ref} />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement));
  });

  it("reports static state under reduced motion when WebGL works", () => {
    // Fake a WebGL2 context just enough to compile and draw.
    const gl = new Proxy(
      {},
      {
        get: (_t, prop) => {
          if (prop === "getShaderParameter" || prop === "getProgramParameter") return () => true;
          if (prop === "getAttribLocation") return () => 0;
          if (typeof prop === "string" && /^[A-Z_0-9]+$/.test(prop)) return 1;
          return () => ({});
        },
      },
    );
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = (() => gl) as never;
    setReducedMotion(true);
    const { container } = render(<ShaderCanvas fragmentShader={frag} />);
    expect(container.querySelector("[data-slot=shader-canvas]")).toHaveAttribute(
      "data-state",
      "static",
    );
    HTMLCanvasElement.prototype.getContext = original;
  });

  it("examples are accessible", async () => {
    for (const Example of [ShaderCanvasMinimal, ShaderCanvasFull, ShaderCanvasFeatureCard]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
