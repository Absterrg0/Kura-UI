import { afterEach, describe, expect, it, vi } from "vitest";
import {
  act,
  axe,
  fireEvent,
  render,
  screen,
  setReducedMotion,
  userEvent,
} from "../../../test/utils";
import { VoiceDictation } from "./voice-dictation";
import {
  VoiceDictationFull,
  VoiceDictationInComposer,
  VoiceDictationMinimal,
} from "./voice-dictation.examples";

const root = () => document.querySelector("[data-slot=voice-dictation]")!;

describe("VoiceDictation", () => {
  afterEach(() => vi.useRealTimers());

  it("falls back to unsupported without Speech or MediaRecorder (jsdom)", () => {
    render(<VoiceDictation className="custom" />);
    expect(root()).toHaveAttribute("data-status", "unsupported");
    expect(root()).toHaveClass("custom");
    expect(screen.getByRole("button", { name: "Dictate" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("not supported");
  });

  it("simulates a full toggle dictation and emits the final transcript", async () => {
    vi.useFakeTimers();
    const onTranscript = vi.fn();
    const onStatusChange = vi.fn();
    render(
      <VoiceDictation
        simulate="hello kura world"
        onTranscript={onTranscript}
        onStatusChange={onStatusChange}
      />,
    );
    const button = screen.getByRole("button", { name: "Dictate" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(button);
    expect(root()).toHaveAttribute("data-status", "requesting");
    await act(async () => vi.advanceTimersByTime(500));
    expect(root()).toHaveAttribute("data-status", "listening");
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Listening");
    await act(async () => vi.advanceTimersByTime(2000));
    expect(document.querySelector("[data-slot=voice-dictation-transcript]")).toHaveTextContent(
      "hello kura world",
    );
    expect(screen.getByText("0:02")).toBeInTheDocument();
    fireEvent.click(button);
    expect(root()).toHaveAttribute("data-status", "processing");
    await act(async () => vi.advanceTimersByTime(700));
    expect(onTranscript).toHaveBeenCalledWith("hello kura world");
    expect(root()).toHaveAttribute("data-status", "idle");
    expect(onStatusChange.mock.calls.map((c) => c[0])).toEqual([
      "requesting",
      "listening",
      "processing",
      "idle",
    ]);
  });

  it("cancel and Escape discard without emitting", async () => {
    vi.useFakeTimers();
    const onTranscript = vi.fn();
    render(<VoiceDictation simulate="one two" onTranscript={onTranscript} />);
    fireEvent.click(screen.getByRole("button", { name: "Dictate" }));
    await act(async () => vi.advanceTimersByTime(1500));
    fireEvent.click(screen.getByRole("button", { name: "Cancel dictation" }));
    expect(root()).toHaveAttribute("data-status", "idle");
    fireEvent.click(screen.getByRole("button", { name: "Dictate" }));
    await act(async () => vi.advanceTimersByTime(1500));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(root()).toHaveAttribute("data-status", "idle");
    await act(async () => vi.advanceTimersByTime(1000));
    expect(onTranscript).not.toHaveBeenCalled();
  });

  it("hold mode listens while Space is held and the hotkey toggles", async () => {
    vi.useFakeTimers();
    const onTranscript = vi.fn();
    render(<VoiceDictation simulate="hold me" mode="hold" onTranscript={onTranscript} />);
    const button = screen.getByRole("button", { name: "Hold to dictate" });
    fireEvent.keyDown(button, { key: " " });
    await act(async () => vi.advanceTimersByTime(1500));
    expect(root()).toHaveAttribute("data-status", "listening");
    fireEvent.keyUp(button, { key: " " });
    await act(async () => vi.advanceTimersByTime(700));
    expect(onTranscript).toHaveBeenCalledWith("hold me");

    // global hotkey (Ctrl+Shift+D off Apple), held then released
    fireEvent.keyDown(document, { key: "D", ctrlKey: true, shiftKey: true });
    await act(async () => vi.advanceTimersByTime(1500));
    expect(root()).toHaveAttribute("data-status", "listening");
    fireEvent.keyUp(document, { key: "D" });
    expect(root()).toHaveAttribute("data-status", "processing");
  });

  it("appends the transcript to a composer", async () => {
    vi.useFakeTimers();
    render(<VoiceDictationInComposer />);
    fireEvent.click(screen.getByRole("button", { name: "Dictate" }));
    await act(async () => vi.advanceTimersByTime(4000));
    fireEvent.click(screen.getByRole("button", { name: "Dictate" }));
    await act(async () => vi.advanceTimersByTime(700));
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue(
      "Find three cafés near the office that open before seven.",
    );
  });

  it("drops the caret blink under reduced motion", async () => {
    vi.useFakeTimers();
    setReducedMotion(true);
    render(<VoiceDictation simulate="calm" />);
    fireEvent.click(screen.getByRole("button", { name: "Dictate" }));
    await act(async () => vi.advanceTimersByTime(1400));
    const caret = document.querySelector("[data-slot=voice-dictation-transcript] [aria-hidden]");
    expect(caret?.className).toContain("motion-reduce:animate-none");
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [VoiceDictationMinimal, VoiceDictationFull, VoiceDictationInComposer]) {
      const { container, unmount } = render(<Example />);
      await act(async () => {});
      await axe(container);
      unmount();
    }
    // and while listening
    const user = userEvent.setup();
    const { container } = render(<VoiceDictation simulate="x" />);
    await user.click(screen.getByRole("button", { name: "Dictate" }));
    await act(async () => new Promise((r) => setTimeout(r, 600)));
    await axe(container);
  });
});
