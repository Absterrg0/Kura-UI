import { createAgent } from "@ui-sdk/react/agent";
import { describe, expect, it, vi } from "vitest";
import {
  axe,
  fireEvent,
  render,
  screen,
  setApplePlatform,
  setReducedMotion,
  userEvent,
} from "../../../test/utils";
import { ApprovalPrompt } from "./approval-prompt";
import {
  ApprovalPromptFull,
  ApprovalPromptMinimal,
  ApprovalPromptResolved,
  ApprovalPromptWithDiff,
} from "./approval-prompt.examples";

describe("ApprovalPrompt", () => {
  it("renders a labelled region with command, risk and data-slot", () => {
    render(
      <ApprovalPrompt
        title="Kura wants to run a command"
        command="rm -rf build"
        risk="high"
        description="Clears output."
        className="custom"
      />,
    );
    const region = screen.getByRole("region", { name: "Kura wants to run a command rm -rf build" });
    expect(region).toHaveAttribute("data-slot", "approval-prompt");
    expect(region).toHaveAttribute("data-decision", "pending");
    expect(region).toHaveAttribute("data-risk", "high");
    expect(region).toHaveClass("custom");
    expect(region).toHaveAccessibleDescription("Clears output.");
    expect(region.querySelector("[data-slot=approval-prompt-code]")).toHaveTextContent(
      "rm -rf build",
    );
    expect(screen.getByText("High risk")).toBeInTheDocument();
    // Waiting on a person: the ember glyph, label and halftone are all there.
    expect(region.querySelector("[data-slot=status-glyph]")).toHaveAttribute(
      "data-status",
      "waiting",
    );
    expect(region.querySelector("[data-slot=halftone]")).toHaveAttribute("data-state", "visible");
    expect(screen.getByRole("button", { name: "Approve" })).toHaveAttribute(
      "data-variant",
      "primary",
    );
  });

  it("approves on click and shows the resolved state", async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    const onDecisionChange = vi.fn();
    render(
      <ApprovalPrompt
        title="Run?"
        command="ls"
        onApprove={onApprove}
        onDecisionChange={onDecisionChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Approve/ }));
    expect(onApprove).toHaveBeenCalledOnce();
    expect(onDecisionChange).toHaveBeenCalledWith(
      "approved",
      expect.objectContaining({ source: expect.any(String) }),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Approved");
    expect(document.querySelector("[data-slot=approval-prompt-actions]")).toHaveAttribute("inert");
  });

  it("binds ⌘↵ to approve and Esc to deny while pending", () => {
    setApplePlatform(true);
    const onApprove = vi.fn();
    const onDeny = vi.fn();
    const { unmount } = render(
      <ApprovalPrompt title="Run?" onApprove={onApprove} onDeny={onDeny} />,
    );
    fireEvent.keyDown(document, { key: "Enter", metaKey: true });
    expect(onApprove).toHaveBeenCalledOnce();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDeny).not.toHaveBeenCalled();
    unmount();
    render(<ApprovalPrompt title="Run?" onDeny={onDeny} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDeny).toHaveBeenCalledOnce();
    expect(screen.getByRole("status")).toHaveTextContent("Denied");
    setApplePlatform(false);
  });

  it("offers always-allow only when handled, and is controllable", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ApprovalPrompt title="Run?" />);
    expect(screen.queryByRole("button", { name: "Always allow" })).toBeNull();
    const onAlwaysAllow = vi.fn();
    rerender(<ApprovalPrompt title="Run?" onAlwaysAllow={onAlwaysAllow} decision="pending" />);
    await user.click(screen.getByRole("button", { name: "Always allow" }));
    expect(onAlwaysAllow).toHaveBeenCalledOnce();
    // controlled: stays pending until the parent changes it
    expect(screen.getByRole("region")).toHaveAttribute("data-decision", "pending");
    rerender(<ApprovalPrompt title="Run?" onAlwaysAllow={onAlwaysAllow} decision="always" />);
    expect(screen.getByRole("status")).toHaveTextContent("Always allowed");
  });

  it("an agent can read and deny it, but approving always waits for a person", async () => {
    let personSaysYes = false;
    const asked: string[] = [];
    const agent = createAgent({
      allow: (step) => {
        if (step.confirm) asked.push(step.confirm);
        return !step.confirm || personSaysYes;
      },
    });
    const onDecisionChange = vi.fn();
    render(
      <ApprovalPrompt
        title="Kura wants to run a migration"
        command="pnpm db:migrate"
        risk="high"
        onDecisionChange={onDecisionChange}
        shortcuts={false}
      />,
    );
    const entry = agent.snapshot().find((e) => e.component === "approval-prompt");
    expect(entry?.label).toContain("Kura wants to run a migration");
    expect(entry?.value).toBe("pending");
    expect(entry?.actions).toEqual(["deny"]);

    // Approving is refused until the person says yes, and they are told exactly what runs.
    const approve = { steps: [{ ref: "Approve", action: "press" }] };
    expect((await agent.act(approve)).ok).toBe(false);
    expect(asked.at(-1)).toBe("Runs pnpm db:migrate");
    expect(onDecisionChange).not.toHaveBeenCalled();
    personSaysYes = true;
    expect((await agent.act(approve)).ok).toBe(true);
    expect(onDecisionChange).toHaveBeenLastCalledWith("approved", { source: "agent" });
  });

  it("an agent's deny is reported with source agent", async () => {
    const agent = createAgent();
    const onDecisionChange = vi.fn();
    render(
      <ApprovalPrompt
        title="Kura wants to delete a branch"
        onDecisionChange={onDecisionChange}
        shortcuts={false}
      />,
    );
    const result = await agent.act({
      steps: [{ ref: "Kura wants to delete a branch", action: "deny" }],
    });
    expect(result.ok, result.error?.message).toBe(true);
    expect(onDecisionChange).toHaveBeenCalledWith("denied", { source: "agent" });
    expect(document.querySelector("[data-slot=approval-prompt]")).toHaveAttribute(
      "data-decision",
      "denied",
    );
  });

  it("expands details", async () => {
    const user = userEvent.setup();
    render(<ApprovalPrompt title="Run?" details={<p>Affects 3 files</p>} />);
    const toggle = screen.getByRole("button", { name: "Details" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(screen.getByRole("button", { name: "Hide details" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(document.querySelector("[data-slot=approval-prompt-details]")).not.toHaveAttribute(
      "inert",
    );
  });

  it("ignores shortcuts when disabled or resolved", () => {
    const onApprove = vi.fn();
    render(<ApprovalPrompt title="Run?" shortcuts={false} onApprove={onApprove} />);
    fireEvent.keyDown(document, { key: "Enter", ctrlKey: true });
    expect(onApprove).not.toHaveBeenCalled();
  });

  it("holds still under reduced motion: no blinking glyph, no travel; the halftone only fades", () => {
    setReducedMotion(true);
    const { container } = render(<ApprovalPrompt title="Run?" />);
    expect(container.innerHTML).toContain("motion-reduce:animate-none");
    expect(container.querySelector("[data-slot=halftone]")?.className).toContain(
      "transition-opacity",
    );
    expect(
      container.querySelector("[data-slot=approval-prompt-actions]")?.parentElement?.innerHTML,
    ).toContain("motion-reduce:translate-y-0");
  });

  it("shows who asked, the facts and how long it has waited; the ember leaves on a decision", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ApprovalPrompt
        title="Run the migration"
        agent={{ name: "migrator", detail: "for step 4 of the plan" }}
        requestedAt={Date.now() - 75_000}
        facts={[{ label: "Rows affected", value: "48,210" }]}
        shortcuts={false}
      />,
    );
    expect(screen.getByText(/asks, for step 4 of the plan/)).toBeInTheDocument();
    expect(container.querySelector("[data-slot=agent-sigil]")).not.toBeNull();
    expect(screen.getByText("Rows affected")).toBeInTheDocument();
    expect(screen.getByText("48,210")).toBeInTheDocument();
    expect(screen.getByText("Needs you")).toBeInTheDocument();
    expect(await screen.findByText(/^1:1\d$/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Deny" }));
    expect(container.querySelector("[data-slot=halftone]")).toHaveAttribute("data-state", "hidden");
    expect(container.querySelector("[data-slot=status-glyph]")).toHaveAttribute(
      "data-status",
      "skipped",
    );
    expect(screen.getByRole("status")).toHaveTextContent("Denied by you. Nothing ran.");
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [
      ApprovalPromptMinimal,
      ApprovalPromptFull,
      ApprovalPromptResolved,
      ApprovalPromptWithDiff,
    ]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  }, 20_000);
});
