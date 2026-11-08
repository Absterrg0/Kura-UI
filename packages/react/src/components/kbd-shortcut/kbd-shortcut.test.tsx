import { afterEach, describe, expect, it, vi } from "vitest";
import {
  act,
  axe,
  fireEvent,
  render,
  screen,
  setApplePlatform,
  setReducedMotion,
} from "../../../test/utils";
import { KbdShortcut } from "./kbd-shortcut";
import {
  KbdShortcutComposerHints,
  KbdShortcutFull,
  KbdShortcutMinimal,
} from "./kbd-shortcut.examples";

describe("KbdShortcut", () => {
  afterEach(() => setApplePlatform(false));

  it("renders label and platform-aware keys", () => {
    setApplePlatform(true);
    render(<KbdShortcut keys={["mod", "enter"]} label="Send" />);
    expect(screen.getByText("Send")).toBeInTheDocument();
    const combo = screen.getByText("Command Enter").parentElement!;
    expect(combo.tagName).toBe("KBD");
    expect(combo).toHaveTextContent("⌘↵");
  });

  it("renders Ctrl on non-Apple platforms", () => {
    setApplePlatform(false);
    render(<KbdShortcut keys={["mod", "k"]} />);
    expect(screen.getByText("Control K").parentElement!).toHaveTextContent("CtrlK");
  });

  it("calls onTrigger and shows the pressed state", () => {
    const onTrigger = vi.fn();
    render(<KbdShortcut keys={["mod", "j"]} label="Toggle" onTrigger={onTrigger} />);
    const root = screen.getByText("Toggle").parentElement!;
    expect(root).toHaveAttribute("data-bound", "true");
    fireEvent.keyDown(document, { key: "j", ctrlKey: true });
    expect(onTrigger).toHaveBeenCalledTimes(1);
    expect(root).toHaveAttribute("data-pressed", "true");
    fireEvent.keyUp(document, { key: "j" });
    expect(root).toHaveAttribute("data-pressed", "false");
  });

  it("requires exact modifiers and respects enabled", () => {
    const onTrigger = vi.fn();
    const { rerender } = render(<KbdShortcut keys={["mod", "j"]} onTrigger={onTrigger} />);
    fireEvent.keyDown(document, { key: "j" });
    fireEvent.keyDown(document, { key: "j", ctrlKey: true, altKey: true });
    expect(onTrigger).not.toHaveBeenCalled();
    rerender(<KbdShortcut keys={["mod", "j"]} onTrigger={onTrigger} enabled={false} />);
    fireEvent.keyDown(document, { key: "j", ctrlKey: true });
    expect(onTrigger).not.toHaveBeenCalled();
  });

  it("ignores un-modified combos while typing in inputs", () => {
    const onTrigger = vi.fn();
    render(
      <>
        <input aria-label="field" />
        <KbdShortcut keys={["/"]} onTrigger={onTrigger} />
      </>,
    );
    fireEvent.keyDown(screen.getByLabelText("field"), { key: "/" });
    expect(onTrigger).not.toHaveBeenCalled();
    fireEvent.keyDown(document.body, { key: "/" });
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it("releases the pressed state automatically if keyup never arrives", () => {
    vi.useFakeTimers();
    render(<KbdShortcut keys={["mod", "j"]} label="Toggle" onTrigger={() => {}} />);
    const root = screen.getByText("Toggle").parentElement!;
    fireEvent.keyDown(document, { key: "j", ctrlKey: true });
    expect(root).toHaveAttribute("data-pressed", "true");
    act(() => vi.advanceTimersByTime(500));
    expect(root).toHaveAttribute("data-pressed", "false");
    vi.useRealTimers();
  });

  it("drops key travel under reduced motion", () => {
    setReducedMotion(true);
    render(<KbdShortcut keys={["mod", "k"]} />);
    const key = document.querySelector("[data-slot=kbd-key]")!;
    expect(key.className).toContain("motion-reduce:data-[pressed=true]:translate-y-0");
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [KbdShortcutMinimal, KbdShortcutFull, KbdShortcutComposerHints]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
