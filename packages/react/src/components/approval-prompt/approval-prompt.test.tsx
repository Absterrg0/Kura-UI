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
    expect(screen.getByText("rm -rf build")).toBeInTheDocument();
    expect(screen.getByText("High risk")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Run anyway/ })).toHaveAttribute(
      "data-variant",
      "danger",
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
    expect(onDecisionChange).toHaveBeenCalledWith("approved");
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

  it("drops blur and the waiting pulse under reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(<ApprovalPrompt title="Run?" />);
    expect(container.innerHTML).toContain("motion-reduce:animate-none");
    expect(container.innerHTML).toContain("motion-reduce:blur-none");
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
