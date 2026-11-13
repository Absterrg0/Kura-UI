import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { act, axe, render, screen, setReducedMotion, userEvent } from "../../../test/utils";
import { Composer, ComposerInput } from "../composer";
import { type SlashCommand, SlashCommandMenu } from "./slash-command-menu";
import {
  SlashCommandMenuFull,
  SlashCommandMenuInComposer,
  SlashCommandMenuMinimal,
} from "./slash-command-menu.examples";

const commands: SlashCommand[] = [
  { id: "sum", label: "Summarize", group: "Write", insert: "Summarize: ", keywords: ["tldr"] },
  { id: "tr", label: "Translate", group: "Write", insert: "Translate: " },
  { id: "web", label: "Web search", group: "Agent", disabled: true },
  { id: "clear", label: "Clear", group: "Session" },
];

function Field(props: Partial<React.ComponentProps<typeof SlashCommandMenu>>) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  return (
    <>
      <textarea ref={ref} aria-label="Prompt" />
      <SlashCommandMenu textareaRef={ref} commands={commands} {...props} />
    </>
  );
}

function InComposer({ onSubmit }: { onSubmit: () => void }) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  return (
    <Composer onSubmit={onSubmit}>
      <ComposerInput ref={ref} />
      <SlashCommandMenu textareaRef={ref} commands={commands} />
    </Composer>
  );
}

function Draft({ text }: { text: string }) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  return (
    <>
      <textarea ref={ref} aria-label="Prompt" defaultValue={text} />
      <button type="button">Elsewhere</button>
      <SlashCommandMenu textareaRef={ref} commands={commands} defaultOpen />
    </>
  );
}

describe("SlashCommandMenu", () => {
  it("opens on / at the start of a line with data-slot and groups", async () => {
    render(<Field className="custom" />);
    const field = screen.getByRole("textbox", { name: "Prompt" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    await userEvent.type(field, "/");
    const menu = document.querySelector("[data-slot=slash-command-menu]")!;
    expect(menu).toHaveClass("custom");
    expect(screen.getByRole("listbox", { name: "Commands" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Write" })).toBeInTheDocument();
    expect(field).toHaveAttribute("aria-autocomplete", "list");
    expect(field.getAttribute("aria-activedescendant")).toBe(
      screen.getByRole("option", { name: /Summarize/ }).id,
    );
  });

  it("is never taller than the room it has, and leaves a side it cannot be read on", async () => {
    const height = window.innerHeight;
    // A short screen with the caret at its top edge: nothing above, 186px below.
    Object.defineProperty(window, "innerHeight", { value: 200, configurable: true });
    render(<Field side="top" />);
    await userEvent.type(screen.getByRole("textbox", { name: "Prompt" }), "/");
    const menu = document.querySelector<HTMLElement>("[data-slot=slash-command-menu]")!;
    // Asked to open upward, but there is no room there: it opens downward instead...
    expect(menu).toHaveAttribute("data-side", "bottom");
    // ...and stops short of the bottom edge; the list inside scrolls.
    expect(Number.parseFloat(menu.style.maxHeight)).toBeLessThanOrEqual(200);
    expect(Number.parseFloat(menu.style.maxHeight)).toBeGreaterThan(0);
    Object.defineProperty(window, "innerHeight", { value: height, configurable: true });
  });

  it("defaultOpen opens on mount from the draft's end, and an outside press closes it", async () => {
    const { unmount } = render(<Draft text="Hello /tr" />);
    expect(screen.getByRole("textbox")).not.toHaveFocus();
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option", { name: /Translate/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Elsewhere" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    unmount();
    render(<Draft text="no trigger here" />);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("does not open mid-word", async () => {
    render(<Field />);
    await userEvent.type(screen.getByRole("textbox"), "and/or");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("filters by label and keywords, and closes on space", async () => {
    render(<Field />);
    const field = screen.getByRole("textbox");
    await userEvent.type(field, "hello /tl");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option", { name: /Summarize/ })).toBeInTheDocument();
    await userEvent.type(field, "x");
    expect(screen.getByRole("status")).toHaveTextContent("No commands");
    await userEvent.type(field, " ");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("navigates with arrows (skipping disabled) and inserts with Enter", async () => {
    const onSelect = vi.fn();
    render(<Field onSelect={onSelect} />);
    const field = screen.getByRole("textbox") as HTMLTextAreaElement;
    await userEvent.type(field, "Please /");
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(screen.getByRole("option", { name: /Clear/ })).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{ArrowUp}{Enter}");
    expect(field.value).toBe("Please Translate: ");
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "tr" }), { query: "" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(field).not.toHaveAttribute("aria-activedescendant");
  });

  it("removes the token for action commands and selects with a click", async () => {
    render(<Field />);
    const field = screen.getByRole("textbox") as HTMLTextAreaElement;
    await userEvent.type(field, "/cl");
    await userEvent.click(screen.getByRole("option", { name: /Clear/ }));
    expect(field.value).toBe("");
  });

  it("Escape dismisses until a new trigger is typed", async () => {
    const onOpenChange = vi.fn();
    render(<Field onOpenChange={onOpenChange} />);
    const field = screen.getByRole("textbox");
    await userEvent.type(field, "/su");
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    await userEvent.type(field, "m");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    await userEvent.type(field, " /");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("keeps Composer from sending while open, and updates its controlled value", async () => {
    const onSubmit = vi.fn();
    render(<InComposer onSubmit={onSubmit} />);
    const field = screen.getByRole("textbox") as HTMLTextAreaElement;
    await userEvent.type(field, "/sum");
    await userEvent.keyboard("{Enter}");
    expect(onSubmit).not.toHaveBeenCalled();
    expect(field.value).toBe("Summarize: ");
    await userEvent.type(field, "this{Enter}");
    expect(onSubmit).toHaveBeenCalledWith({ text: "Summarize: this", attachments: [] });
  });

  it("under reduced motion it relies on the token-driven pop-in (no travel)", async () => {
    setReducedMotion(true);
    render(<Field />);
    await userEvent.type(screen.getByRole("textbox"), "/");
    expect(document.querySelector("[data-slot=slash-command-menu]")!.className).toContain(
      "animate-kura-pop-in",
    );
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [
      SlashCommandMenuMinimal,
      SlashCommandMenuFull,
      SlashCommandMenuInComposer,
    ]) {
      const { container, unmount } = render(<Example />);
      await act(async () => {});
      await axe(container);
      unmount();
    }
  });

  it("the open menu has no a11y violations", async () => {
    render(<Field />);
    await userEvent.type(screen.getByRole("textbox"), "/");
    await axe(document.body);
  });
});
