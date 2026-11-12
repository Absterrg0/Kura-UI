import { describe, expect, it, vi } from "vitest";
import { axe, fireEvent, render, screen, setReducedMotion, userEvent } from "../../../test/utils";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageAvatar,
  MessageBranch,
  MessageCopyButton,
  MessageFeedback,
} from "./message";
import { MessageFull, MessageMinimal, MessageStates, MessageThread } from "./message.examples";
import { MessageList } from "./message-list";

describe("Message", () => {
  it("renders user and assistant variants with data attributes", () => {
    const { container } = render(
      <>
        <Message from="user" className="custom">
          Hi
        </Message>
        <Message from="assistant" name="Kura" timestamp={new Date(2026, 0, 1, 10, 42)}>
          Hello
        </Message>
      </>,
    );
    const [user, assistant] = container.querySelectorAll("[data-slot=message]");
    expect(user).toHaveAttribute("data-from", "user");
    expect(user).toHaveClass("custom");
    expect(assistant).toHaveAttribute("data-from", "assistant");
    expect(assistant).toHaveAttribute("data-status", "idle");
    expect(screen.getByText("Kura")).toBeInTheDocument();
    expect(assistant!.querySelector("time")).toHaveAttribute("dateTime");
  });

  it("shows the error row with retry", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <Message from="assistant" status="error" error="Rate limited" onRetry={onRetry}>
        Partial
      </Message>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Rate limited");
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("keeps actions laid out but inert while streaming", () => {
    const { container } = render(
      <Message
        from="assistant"
        status="streaming"
        actions={
          <MessageActions>
            <MessageAction label="Regenerate" icon={<span />} />
          </MessageActions>
        }
      >
        Typing
      </Message>,
    );
    expect(container.firstElementChild).toHaveAttribute("aria-busy", "true");
    const row = container.querySelector("[data-slot=message-actions-row]")!;
    expect(row).toHaveAttribute("inert");
    expect(row.firstElementChild).toHaveClass("invisible");
  });

  it("copies with confirmation", async () => {
    const user = userEvent.setup();
    const onCopied = vi.fn();
    render(<MessageCopyButton text="hello" onCopied={onCopied} />);
    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(await navigator.clipboard.readText()).toBe("hello");
    expect(onCopied).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
  });

  it("feedback toggles uncontrolled and reports changes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<MessageFeedback onValueChange={onValueChange} />);
    const up = screen.getByRole("button", { name: "Good response" });
    await user.click(up);
    expect(up).toHaveAttribute("aria-pressed", "true");
    expect(onValueChange).toHaveBeenLastCalledWith("up");
    await user.click(screen.getByRole("button", { name: "Bad response" }));
    expect(up).toHaveAttribute("aria-pressed", "false");
    await user.click(screen.getByRole("button", { name: "Bad response" }));
    expect(onValueChange).toHaveBeenLastCalledWith(null);
  });

  it("feedback is controllable", () => {
    const { rerender } = render(<MessageFeedback value="down" />);
    expect(screen.getByRole("button", { name: "Bad response" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    rerender(<MessageFeedback value={null} />);
    expect(screen.getByRole("button", { name: "Bad response" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("branch navigation moves between versions and disables at the ends", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender, container } = render(
      <MessageBranch current={1} total={3} onCurrentChange={onChange} />,
    );
    // Disabled but still focusable, so its tooltip can say what it is.
    const prev = screen.getByRole("button", { name: "Previous version" });
    expect(prev).toHaveAttribute("aria-disabled", "true");
    await user.click(prev);
    expect(onChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Next version" }));
    expect(onChange).toHaveBeenCalledWith(2);
    expect(container).toHaveTextContent("Version 1/ of 3");
    rerender(<MessageBranch current={1} total={1} />);
    expect(container.querySelector("[data-slot=message-branch]")).toBeNull();
  });

  it("avatar falls back to the dot sigil of the name", () => {
    const { container } = render(<MessageAvatar name="Ada Lovelace" />);
    expect(container.querySelector("[data-slot=agent-sigil]")).not.toBeNull();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });
});

describe("MessageList", () => {
  function setup() {
    const { container } = render(
      <MessageList style={{ height: 200 }}>
        <Message from="user">One</Message>
      </MessageList>,
    );
    const viewport = container.querySelector("[data-slot=message-list-viewport]") as HTMLElement;
    let top = 0;
    Object.defineProperty(viewport, "scrollHeight", { configurable: true, value: 1000 });
    Object.defineProperty(viewport, "clientHeight", { configurable: true, value: 200 });
    Object.defineProperty(viewport, "scrollTop", {
      configurable: true,
      get: () => top,
      set: (v: number) => {
        top = v;
      },
    });
    viewport.scrollTo = ((opts: ScrollToOptions) => {
      top = opts.top ?? top;
      fireEvent.scroll(viewport);
    }) as typeof viewport.scrollTo;
    return { container, viewport, setTop: (v: number) => (top = v) };
  }

  it("is a labelled log with a hidden jump pill at the bottom", () => {
    const { container, viewport, setTop } = setup();
    expect(screen.getByRole("log", { name: "Conversation" })).toBe(viewport);
    setTop(800);
    fireEvent.scroll(viewport);
    expect(container.firstElementChild).toHaveAttribute("data-at-bottom", "true");
    expect(container.querySelector("[data-slot=message-list-jump]")).toHaveAttribute(
      "data-state",
      "hidden",
    );
  });

  it("shows “Jump to latest” after scrolling up and returns to the bottom", async () => {
    const { container, viewport, setTop } = setup();
    setTop(800);
    fireEvent.scroll(viewport);
    fireEvent.wheel(viewport, { deltaY: -100 });
    setTop(300);
    fireEvent.scroll(viewport);
    const jump = screen.getByRole("button", { name: "Jump to latest" });
    expect(jump).toHaveAttribute("data-state", "visible");
    fireEvent.click(jump);
    expect(viewport.scrollTop).toBe(1000);
    expect(container.firstElementChild).toHaveAttribute("data-at-bottom", "true");
  });

  it("removes travel from the jump pill under reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(<MessageList />);
    expect(container.querySelector("[data-slot=message-list-jump]")!.className).toContain(
      "motion-reduce:translate-y-0",
    );
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [MessageMinimal, MessageFull, MessageStates, MessageThread]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
