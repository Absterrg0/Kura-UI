import { createAgent } from "@ui-sdk/react/agent";
import { describe, expect, it, vi } from "vitest";
import { axe, render, screen, userEvent } from "../../../test/utils";
import { Button, buttonVariants } from "./button";
import { ButtonAsLink, ButtonFull, ButtonMinimal } from "./button.examples";

describe("Button", () => {
  it("renders a type=button with data attributes", () => {
    render(<Button>Go</Button>);
    const btn = screen.getByRole("button", { name: "Go" });
    expect(btn).toHaveAttribute("type", "button");
    expect(btn).toHaveAttribute("data-slot", "button");
    expect(btn).toHaveAttribute("data-variant", "primary");
  });

  it("handles clicks and keyboard activation", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    const btn = screen.getByRole("button");
    await userEvent.click(btn);
    btn.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it("loading ignores presses, sets aria-busy and keeps focus and the label", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );
    const btn = screen.getByRole("button", { name: /save/i });
    expect(btn).toHaveAttribute("aria-disabled", "true");
    expect(btn).toHaveAttribute("aria-busy", "true");
    expect(btn).not.toHaveAttribute("disabled");
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("supports asChild and forwards ref", () => {
    const ref = { current: null as HTMLAnchorElement | null };
    render(
      <Button asChild>
        <a href="/x" ref={ref}>
          Read the docs
        </a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Read the docs" });
    expect(link).toHaveAttribute("data-slot", "button");
    expect(ref.current).toBe(link);
  });

  it("an agent can find and press it, and a person gates a marked one", async () => {
    let approve = false;
    const agent = createAgent({ allow: (step) => !step.confirm || approve });
    const save = vi.fn();
    const remove = vi.fn();
    render(
      <>
        <Button onClick={save}>Save draft</Button>
        <Button variant="danger" data-agent-confirm="Deletes the draft" onClick={remove}>
          Delete draft
        </Button>
      </>,
    );
    const labels = agent.snapshot().map((e) => e.label);
    expect(labels).toEqual(expect.arrayContaining(["Save draft", "Delete draft"]));
    expect((await agent.act({ steps: [{ ref: "Save draft", action: "press" }] })).ok).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
    const del = { steps: [{ ref: "Delete draft", action: "press" }] };
    expect((await agent.act(del)).ok).toBe(false);
    expect(remove).not.toHaveBeenCalled();
    approve = true;
    expect((await agent.act(del)).ok).toBe(true);
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it("merges className and exposes buttonVariants", () => {
    render(<Button className="w-full">Wide</Button>);
    expect(screen.getByRole("button")).toHaveClass("w-full");
    expect(buttonVariants({ variant: "ghost" })).toContain("bg-transparent");
  });

  it("removes the press scale under reduced motion", () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole("button").className).toContain(
      "motion-reduce:active:not-disabled:scale-100",
    );
  });

  it("examples are accessible", async () => {
    for (const Example of [ButtonMinimal, ButtonFull, ButtonAsLink]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
