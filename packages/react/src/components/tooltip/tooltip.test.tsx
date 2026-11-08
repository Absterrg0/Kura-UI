import { describe, expect, it } from "vitest";
import { act, axe, render, screen, userEvent } from "../../../test/utils";
import { Tooltip } from "./tooltip";
import { TooltipFull, TooltipMinimal } from "./tooltip.examples";

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
    for (const Example of [TooltipMinimal, TooltipFull]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
