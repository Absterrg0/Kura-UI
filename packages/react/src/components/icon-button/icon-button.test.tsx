import { Copy } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { axe, render, screen, userEvent } from "../../../test/utils";
import { IconButton } from "./icon-button";
import {
  IconButtonFull,
  IconButtonMessageActions,
  IconButtonMinimal,
} from "./icon-button.examples";

describe("IconButton", () => {
  it("uses label as the accessible name", () => {
    render(<IconButton label="Copy" icon={<Copy />} />);
    const btn = screen.getByRole("button", { name: "Copy" });
    expect(btn).toHaveAttribute("data-slot", "icon-button");
    expect(btn).toHaveAttribute("data-variant", "ghost");
  });

  it("shows a tooltip on focus with shortcut", async () => {
    render(<IconButton label="Send" icon={<Copy />} shortcut={["mod", "enter"]} />);
    await userEvent.tab();
    const tip = await screen.findByRole("tooltip");
    expect(tip).toHaveTextContent("Send");
  });

  it("clicks and respects disabled", async () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <IconButton label="Go" icon={<Copy />} onClick={onClick} tooltip={false} />,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(<IconButton label="Go" icon={<Copy />} onClick={onClick} tooltip={false} disabled />);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("keeps the reduced motion press override from Button", () => {
    render(<IconButton label="Go" icon={<Copy />} tooltip={false} />);
    expect(screen.getByRole("button").className).toContain(
      "motion-reduce:active:not-disabled:scale-100",
    );
  });

  it("examples are accessible", async () => {
    for (const Example of [IconButtonMinimal, IconButtonFull, IconButtonMessageActions]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
