import { describe, expect, it } from "vitest";
import { act, axe, render, screen, userEvent } from "../../../test/utils";
import { Tooltip, TooltipProvider } from "./tooltip";
import { TooltipEditorToolbar, TooltipFull, TooltipMinimal } from "./tooltip.examples";

describe("Tooltip", () => {
  it("opens on keyboard focus and describes the trigger", async () => {
    render(
      <Tooltip content="Copy" shortcut={["mod", "c"]}>
        <button type="button">Trigger</button>
      </Tooltip>,
    );
    await userEvent.tab();
    const tip = await screen.findByRole("tooltip");
    expect(tip).toHaveTextContent("Copy");
    expect(document.querySelector("[data-slot=tooltip-content]")).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute("aria-describedby");
  });

  it("closes on Escape", async () => {
    render(
      <Tooltip content="Copy">
        <button type="button">Trigger</button>
      </Tooltip>,
    );
    await userEvent.tab();
    await screen.findByRole("tooltip");
    await act(() => userEvent.keyboard("{Escape}"));
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("joins a surrounding TooltipProvider instead of nesting its own", async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip content="Bold">
          <button type="button">B</button>
        </Tooltip>
      </TooltipProvider>,
    );
    await user.hover(screen.getByRole("button", { name: "B" }));
    // The provider's 0ms delay applies; a nested provider of its own would wait 500ms.
    expect(await screen.findByRole("tooltip", {}, { timeout: 200 })).toHaveTextContent("Bold");
  });

  it("renders only the trigger when disabled", () => {
    render(
      <Tooltip content="Nope" disabled>
        <button type="button">Trigger</button>
      </Tooltip>,
    );
    expect(screen.getByRole("button")).not.toHaveAttribute("data-state");
  });

  it("uses origin-aware animation classes that reduced motion neutralises via tokens", async () => {
    render(
      <Tooltip content="Copy">
        <button type="button">Trigger</button>
      </Tooltip>,
    );
    await userEvent.tab();
    await screen.findByRole("tooltip");
    const content = document.querySelector("[data-slot=tooltip-content]")!;
    expect(content.className).toContain("origin-(--radix-tooltip-content-transform-origin)");
  });

  it("examples are accessible", async () => {
    for (const Example of [TooltipMinimal, TooltipFull, TooltipEditorToolbar]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
