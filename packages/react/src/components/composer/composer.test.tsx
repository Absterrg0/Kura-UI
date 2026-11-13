import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import {
  act,
  axe,
  fireEvent,
  render,
  screen,
  setReducedMotion,
  userEvent,
} from "../../../test/utils";
import {
  Composer,
  ComposerActions,
  ComposerHint,
  ComposerInput,
  type ComposerStatus,
  ComposerSubmit,
  ComposerToolbar,
} from "./composer";
import {
  ComposerFull,
  ComposerMinimal,
  ComposerNewChat,
  ComposerStates,
} from "./composer.examples";

const file = (name: string, type: string, size = 10) =>
  new File(["x".repeat(size)], name, { type });

function Controlled() {
  const [value, setValue] = React.useState("draft");
  return (
    <>
      <Composer value={value} onValueChange={setValue} />
      <output>{value}</output>
    </>
  );
}

describe("Composer", () => {
  it("renders the default layout with data-slots", () => {
    render(<Composer className="custom" placeholder="Ask" />);
    const root = document.querySelector("[data-slot=composer]")!;
    expect(root).toHaveClass("custom");
    expect(root).toHaveAttribute("data-status", "idle");
    const input = screen.getByRole("textbox", { name: "Message" });
    expect(input).toHaveAttribute("data-slot", "composer-input");
    expect(input).toHaveAttribute("placeholder", "Ask");
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Attach files" })).toBeInTheDocument();
  });

  it("sends on Enter with trimmed text and clears; Shift+Enter adds a newline", async () => {
    const onSubmit = vi.fn();
    render(<Composer onSubmit={onSubmit} />);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "  hello{Shift>}{Enter}{/Shift}world  ");
    expect(onSubmit).not.toHaveBeenCalled();
    expect(input).toHaveValue("  hello\nworld  ");
    await userEvent.keyboard("{Enter}");
    expect(onSubmit).toHaveBeenCalledWith({ text: "hello\nworld", attachments: [] });
    expect(input).toHaveValue("");
  });

  it("never sends while an IME is composing", () => {
    const onSubmit = vi.fn();
    render(<Composer defaultValue="にほん" onSubmit={onSubmit} />);
    const input = screen.getByRole("textbox");
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    fireEvent.keyDown(input, { key: "Enter", keyCode: 229 });
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("supports submitKey mod+enter", () => {
    const onSubmit = vi.fn();
    render(<Composer defaultValue="hi" submitKey="mod+enter" onSubmit={onSubmit} />);
    const input = screen.getByRole("textbox");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Enter", ctrlKey: true });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("works controlled", async () => {
    render(<Controlled />);
    await userEvent.type(screen.getByRole("textbox"), "!");
    expect(screen.getByRole("status")).toHaveTextContent("draft!");
  });

  it("becomes a stop button while busy; Escape and click call onStop", async () => {
    const onStop = vi.fn();
    const onSubmit = vi.fn();
    const { rerender } = render(
      <Composer status="streaming" defaultValue="next" onStop={onStop} onSubmit={onSubmit} />,
    );
    const root = document.querySelector("[data-slot=composer]")!;
    expect(root).toHaveAttribute("aria-busy", "true");
    const stop = screen.getByRole("button", { name: "Stop generating" });
    expect(stop).toHaveAttribute("data-mode", "stop");
    await userEvent.click(stop);
    expect(onStop).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
    expect(onStop).toHaveBeenCalledTimes(2);
    // Enter does not double-send while busy.
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    expect(onSubmit).not.toHaveBeenCalled();
    rerender(<Composer status="submitted" defaultValue="next" onStop={onStop} />);
    expect(document.querySelector("[data-slot=composer-submit-pending]")).toBeInTheDocument();
    rerender(<Composer status={"idle" as ComposerStatus} defaultValue="next" onStop={onStop} />);
    expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled();
  });

  it("blocks sending over maxLength and flags the input", () => {
    const onSubmit = vi.fn();
    render(
      <Composer defaultValue="123456" maxLength={5} onSubmit={onSubmit}>
        <ComposerInput />
        <ComposerToolbar>
          <ComposerActions>
            <ComposerHint />
            <ComposerSubmit tooltip={false} />
          </ComposerActions>
        </ComposerToolbar>
      </Composer>,
    );
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("6 / 5")).toBeInTheDocument();
    expect(document.querySelector("[data-slot=composer-hint]")).toHaveAttribute(
      "data-level",
      "over",
    );
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("attaches pasted and dropped files, respects accept, and sends them", async () => {
    const onSubmit = vi.fn();
    const onRejected = vi.fn();
    render(<Composer accept="image/*,.pdf" onSubmit={onSubmit} onFilesRejected={onRejected} />);
    const input = screen.getByRole("textbox");
    fireEvent.paste(input, {
      clipboardData: { files: [file("shot.png", "image/png")], items: [], types: ["Files"] },
    });
    const root = document.querySelector("[data-slot=composer]")!;
    const dataTransfer = {
      files: [file("deck.pdf", "application/pdf"), file("x.exe", "application/x-msdownload")],
      types: ["Files"],
      items: [],
    };
    fireEvent.dragEnter(root, { dataTransfer });
    expect(root).toHaveAttribute("data-dragging", "true");
    fireEvent.drop(root, { dataTransfer });
    expect(root).not.toHaveAttribute("data-dragging");
    expect(screen.getByRole("list", { name: "Attachments" })).toBeInTheDocument();
    expect(screen.getByTitle("shot.png")).toBeInTheDocument();
    expect(screen.getByText("deck.pdf")).toBeInTheDocument();
    expect(onRejected).toHaveBeenCalledWith([dataTransfer.files[1]]);

    await userEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(onSubmit.mock.calls[0]?.[0].attachments.map((a: { name: string }) => a.name)).toEqual([
      "shot.png",
      "deck.pdf",
    ]);
    expect(screen.queryByRole("list", { name: "Attachments" })).not.toBeInTheDocument();
  });

  it("removes an attachment and refocuses the input", async () => {
    render(
      <Composer defaultAttachments={[{ id: "1", name: "notes.md", size: 20 }]} defaultValue="" />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Remove notes.md" }));
    expect(screen.queryByText("notes.md")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveFocus();
  });

  it("disables everything when disabled", () => {
    render(<Composer disabled defaultValue="hi" />);
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
    expect(document.querySelector("[data-slot=composer]")).toHaveAttribute("data-disabled", "true");
  });

  it("under reduced motion the pending ring holds still instead of chasing", () => {
    setReducedMotion(true);
    render(<Composer status="submitted" defaultValue="x" />);
    const ring = document.querySelector("[data-slot=composer-submit-pending] svg")!;
    expect(ring.innerHTML).toContain("motion-reduce:animate-none");
    expect(ring.outerHTML).not.toContain("animate-kura-pulse");
    expect(screen.getByRole("button", { name: "Stop generating" })).toBeInTheDocument();
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [ComposerMinimal, ComposerFull, ComposerStates, ComposerNewChat]) {
      const { container, unmount } = render(<Example />);
      await act(async () => {});
      await axe(container);
      unmount();
    }
  });
});
