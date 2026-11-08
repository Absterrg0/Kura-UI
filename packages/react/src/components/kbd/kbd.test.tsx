import { afterEach, describe, expect, it } from "vitest";
import { axe, render, screen, setApplePlatform } from "../../../test/utils";
import { Kbd } from "./kbd";
import { KbdFull, KbdMinimal } from "./kbd.examples";

describe("Kbd", () => {
  afterEach(() => setApplePlatform(false));

  it("renders a single key from children", () => {
    render(<Kbd>Esc</Kbd>);
    const el = screen.getByText("Esc");
    expect(el.tagName).toBe("KBD");
    expect(el).toHaveAttribute("data-slot", "kbd");
  });

  it("renders combos with a spoken label", () => {
    setApplePlatform(true);
    render(<Kbd keys={["mod", "shift", "k"]} />);
    const combo = screen.getByText("Command Shift K").parentElement!;
    expect(combo).toHaveTextContent("⌘⇧K");
    expect(combo.querySelectorAll("[data-slot=kbd-key]")).toHaveLength(3);
  });

  it("uses Ctrl off Apple platforms", () => {
    render(<Kbd keys={["mod", "k"]} />);
    expect(screen.getByText("Control K").parentElement!).toHaveTextContent("CtrlK");
  });

  it("reflects pressed and drops travel under reduced motion", () => {
    render(<Kbd pressed>A</Kbd>);
    const el = screen.getByText("A");
    expect(el).toHaveAttribute("data-pressed", "true");
    expect(el.className).toContain("motion-reduce:data-[pressed=true]:translate-y-0");
  });

  it("examples are accessible", async () => {
    for (const Example of [KbdMinimal, KbdFull]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
