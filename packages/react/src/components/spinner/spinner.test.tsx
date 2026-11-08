import { describe, expect, it } from "vitest";
import { axe, render, screen } from "../../../test/utils";
import { Spinner } from "./spinner";
import { SpinnerFull, SpinnerMinimal } from "./spinner.examples";

describe("Spinner", () => {
  it("renders a labelled status by default", () => {
    render(<Spinner />);
    const el = screen.getByRole("status");
    expect(el).toHaveTextContent("Loading");
    expect(el).toHaveAttribute("data-slot", "spinner");
  });

  it("is hidden from assistive tech when label is null", () => {
    const { container } = render(<Spinner label={null} className="text-red-500" />);
    const el = container.querySelector("[data-slot=spinner]")!;
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el).toHaveClass("text-red-500");
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("pulses instead of spinning under reduced motion", () => {
    const { container } = render(<Spinner />);
    expect(container.innerHTML).toContain("motion-reduce:animate-kura-pulse");
  });

  it("examples are accessible", async () => {
    for (const Example of [SpinnerMinimal, SpinnerFull]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
