import { describe, expect, it, vi } from "vitest";
import { axe, render, screen, userEvent } from "../../../test/utils";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "./popover";
import { PopoverFull, PopoverMinimal, PopoverShareChat } from "./popover.examples";

function Demo(props: { onOpenChange?: (open: boolean) => void }) {
  return (
    <Popover onOpenChange={props.onOpenChange}>
      <PopoverTrigger>Open</PopoverTrigger>
      <PopoverContent aria-label="Panel">
        <PopoverClose>Close</PopoverClose>
      </PopoverContent>
    </Popover>
  );
}

describe("Popover", () => {
  it("opens from the trigger and moves focus inside", async () => {
    const onOpenChange = vi.fn();
    render(<Demo onOpenChange={onOpenChange} />);
    const trigger = screen.getByRole("button", { name: "Open" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "Panel" });
    expect(dialog).toHaveAttribute("data-slot", "popover-content");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("closes on Escape and returns focus", async () => {
    render(<Demo />);
    const trigger = screen.getByRole("button", { name: "Open" });
    await userEvent.click(trigger);
    await screen.findByRole("dialog");
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it("supports controlled usage via the full example", async () => {
    render(<PopoverFull />);
    await userEvent.click(screen.getByRole("button", { name: /generation settings/i }));
    expect(await screen.findByRole("dialog", { name: "Generation" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("animation is origin-aware (reduced motion handled by tokens)", async () => {
    render(<Demo />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    const content = await screen.findByRole("dialog");
    expect(content.className).toContain("origin-(--radix-popover-content-transform-origin)");
  });

  it("is accessible open and closed", async () => {
    const { container } = render(<PopoverMinimal />);
    await axe(container);
    await userEvent.click(screen.getByRole("button", { name: "Usage" }));
    expect(await screen.findByRole("dialog", { name: "Weekly usage" })).toBeInTheDocument();
    await axe(document.body);
  });

  it("share composition switches visibility and stays accessible open", async () => {
    const { container } = render(<PopoverShareChat />);
    await axe(container);
    await userEvent.click(screen.getByRole("button", { name: "Share" }));
    const dialog = await screen.findByRole("dialog", { name: "Share this chat" });
    expect(screen.getByRole("button", { name: /copy link/i })).toBeDisabled();
    await userEvent.click(screen.getByRole("radio", { name: /anyone with the link/i }));
    expect(screen.getByRole("radio", { name: /anyone with the link/i })).toBeChecked();
    expect(screen.getByRole("button", { name: /copy link/i })).toBeEnabled();
    expect(dialog).toBeInTheDocument();
    await axe(document.body);
  });
});
