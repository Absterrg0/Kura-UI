import { describe, expect, it, vi } from "vitest";
import { axe, fireEvent, render, screen, setReducedMotion, userEvent } from "../../../test/utils";
import { PromptQueue, type QueuedPrompt } from "./prompt-queue";
import {
  PromptQueueComposition,
  PromptQueueFull,
  PromptQueueMinimal,
  PromptQueueTray,
} from "./prompt-queue.examples";

const items: QueuedPrompt[] = [
  { id: "a", text: "Use refreshSession()", attachments: [{ name: "flow.png", type: "image" }] },
  { id: "b", text: "Skip src/legacy/" },
  { id: "c", text: "Update the README" },
];

const texts = () =>
  [...document.querySelectorAll("[data-slot=prompt-queue-text]")].map((e) => e.textContent);

describe("PromptQueue", () => {
  it("renders a labelled list with data-slot and attachments", () => {
    render(<PromptQueue defaultItems={items} className="custom" />);
    const root = document.querySelector("[data-slot=prompt-queue]");
    expect(root).toHaveClass("custom");
    expect(root).toHaveAttribute("data-variant", "panel");
    expect(screen.getByRole("list", { name: /Queued/ })).toBeInTheDocument();
    expect(
      screen.getByRole("listitem", { name: "1 of 3: Use refreshSession()" }),
    ).toBeInTheDocument();
    expect(screen.getByText("flow.png")).toBeInTheDocument();
  });

  it("renders nothing visible when empty", () => {
    const { container } = render(<PromptQueue items={[]} />);
    expect(container.querySelector("[data-slot=prompt-queue]")).toBeNull();
  });

  it("moves, removes and sends now with buttons (uncontrolled)", async () => {
    const user = userEvent.setup();
    const onItemsChange = vi.fn();
    const onSendNow = vi.fn();
    render(
      <PromptQueue defaultItems={items} onItemsChange={onItemsChange} onSendNow={onSendNow} />,
    );
    expect(screen.getAllByRole("button", { name: "Move up" })[0]).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await user.click(screen.getAllByRole("button", { name: "Move down" })[0] as HTMLElement);
    expect(texts()).toEqual(["Skip src/legacy/", "Use refreshSession()", "Update the README"]);
    expect(screen.getByRole("status")).toHaveTextContent("Moved to position 2 of 3");
    await user.click(screen.getAllByRole("button", { name: "Remove" })[2] as HTMLElement);
    expect(texts()).toEqual(["Skip src/legacy/", "Use refreshSession()"]);
    await user.click(screen.getAllByRole("button", { name: /Send now/ })[0] as HTMLElement);
    expect(onSendNow).toHaveBeenCalledWith(items[1]);
    expect(texts()).toEqual(["Use refreshSession()"]);
    expect(onItemsChange).toHaveBeenCalledTimes(3);
  });

  it("supports keyboard: Alt+arrows, Delete and Mod+Enter on a focused item", () => {
    const onSendNow = vi.fn();
    render(<PromptQueue defaultItems={items} onSendNow={onSendNow} />);
    const first = screen.getByRole("listitem", { name: /^1 of 3/ });
    fireEvent.keyDown(first, { key: "ArrowDown", altKey: true });
    expect(texts()[1]).toBe("Use refreshSession()");
    const moved = screen.getByRole("listitem", { name: /Use refreshSession/ });
    fireEvent.keyDown(moved, { key: "Delete" });
    expect(texts()).toEqual(["Skip src/legacy/", "Update the README"]);
    fireEvent.keyDown(screen.getByRole("listitem", { name: /Skip/ }), {
      key: "Enter",
      ctrlKey: true,
    });
    expect(onSendNow).toHaveBeenCalledWith(items[1]);
  });

  it("edits inline: Enter saves, Escape cancels, empty removes", async () => {
    const user = userEvent.setup();
    const onItemsChange = vi.fn();
    render(<PromptQueue items={items} onItemsChange={onItemsChange} />);
    fireEvent.keyDown(screen.getByRole("listitem", { name: /^2 of 3/ }), { key: "Enter" });
    const editor = screen.getByRole("textbox", { name: "Edit queued prompt 2" });
    expect(editor).toHaveFocus();
    await user.clear(editor);
    await user.type(editor, "Leave src/legacy/ alone{Enter}");
    expect(onItemsChange).toHaveBeenLastCalledWith([
      items[0],
      { ...items[1], text: "Leave src/legacy/ alone" },
      items[2],
    ]);
    await user.click(screen.getAllByRole("button", { name: "Edit" })[0] as HTMLElement);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(onItemsChange).toHaveBeenCalledOnce();
  });

  it("renders the tray variant", () => {
    render(<PromptQueue defaultItems={items} variant="tray" />);
    expect(document.querySelector("[data-slot=prompt-queue]")).toHaveAttribute(
      "data-variant",
      "tray",
    );
  });

  it("snaps reorders into place under reduced motion", () => {
    setReducedMotion(true);
    render(<PromptQueue defaultItems={items} />);
    fireEvent.keyDown(screen.getByRole("listitem", { name: /^1 of 3/ }), {
      key: "ArrowDown",
      altKey: true,
    });
    expect(texts()[0]).toBe("Skip src/legacy/");
    setReducedMotion(false);
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [
      PromptQueueMinimal,
      PromptQueueFull,
      PromptQueueTray,
      PromptQueueComposition,
    ]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  }, 20_000);
});
