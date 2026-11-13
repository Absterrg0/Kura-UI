import { afterEach, describe, expect, it, vi } from "vitest";
import {
  act,
  axe,
  render,
  screen,
  setReducedMotion,
  userEvent,
  waitFor,
} from "../../../test/utils";
import { AnsiScreen, parseAnsi, stripAnsi } from "./ansi";
import { Terminal } from "./terminal";
import {
  TerminalCollapsed,
  TerminalComposition,
  TerminalFull,
  TerminalMinimal,
} from "./terminal.examples";

describe("ANSI parsing", () => {
  it("maps SGR colours and styles, and resets", () => {
    const [line] = parseAnsi("\x1b[1;31mFAIL\x1b[0m ok \x1b[2mdim\x1b[22m \x1b[92mbright\x1b[39m");
    expect(line!.map((s) => [s.text, s.style])).toEqual([
      ["FAIL", { bold: true, fg: "red" }],
      [" ok ", {}],
      ["dim", { dim: true }],
      [" ", {}],
      ["bright", { fg: "green" }],
    ]);
  });

  it("keeps styles across lines and maps 90 to gray, 256 and truecolour to the nearest basic colour", () => {
    const lines = parseAnsi(
      "\x1b[33mone\ntwo\x1b[39m\n\x1b[90mg\x1b[38;5;196mr\x1b[38;2;0;200;0mG",
    );
    expect(lines[1]![0]).toEqual({ text: "two", style: { fg: "yellow" } });
    expect(lines[2]!.map((s) => s.style.fg)).toEqual(["gray", "red", "green"]);
  });

  it("applies carriage returns, erase-line and cursor-up like a terminal", () => {
    expect(stripAnsi("Downloading 10%\rDownloading 55%\rDone           ")).toBe("Done");
    expect(stripAnsi("a\nprogress 1/3\x1b[1A\x1b[2K\rheader\n")).toBe("header\nprogress 1/3");
    expect(stripAnsi("abc\bd")).toBe("abd");
    expect(stripAnsi("x\r\ny")).toBe("x\ny");
  });

  it("strips OSC hyperlinks and titles and survives sequences split across chunks", () => {
    const screen = new AnsiScreen();
    screen.write("\x1b]8;;https://acme.dev\x07link\x1b]8;;\x07 \x1b[3");
    screen.write("2mok\x1b");
    screen.write("[0m!");
    expect(screen.lines[0]!.text).toBe("link ok!");
    const spans = screen.spans(screen.lines[0]!);
    expect(spans.find((s) => s.text === "ok")!.style).toEqual({ fg: "green" });
  });
});

describe("Terminal", () => {
  afterEach(() => vi.useRealTimers());

  it("renders the prompt, output and data attributes", () => {
    const { container } = render(
      <Terminal
        className="custom"
        command="pnpm test"
        cwd="~/acme/web"
        lines={["\x1b[32m✓\x1b[39m 31 passed"]}
        exitCode={0}
      />,
    );
    const root = container.querySelector("[data-slot=terminal]")!;
    expect(root).toHaveClass("custom");
    expect(root).toHaveAttribute("data-status", "done");
    expect(screen.getByText("pnpm test")).toBeInTheDocument();
    expect(screen.getByText("~/acme/web")).toBeInTheDocument();
    expect(screen.getByText("exit 0")).toBeInTheDocument();
    const log = screen.getByRole("log", { name: "Output of pnpm test" });
    expect(log).toHaveTextContent("✓ 31 passed");
    expect(log.querySelector("span[style]")).toHaveTextContent("✓");
  });

  it("derives status from the exit code and shows a failing badge", () => {
    const { container } = render(<Terminal command="pnpm test" lines="boom" exitCode={1} />);
    expect(container.querySelector("[data-slot=terminal]")).toHaveAttribute(
      "data-status",
      "failed",
    );
    expect(screen.getByText("exit 1")).toHaveClass("text-kura-danger-text");
  });

  it("consumes a stream, shows a cursor while running and reports the end", async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => {
      release = r;
    });
    async function* out() {
      yield "Resolving packages\n";
      await gate;
      yield "Done in 2.1s\n";
    }
    const onStreamEnd = vi.fn();
    const { container } = render(
      <Terminal command="pnpm install" stream={out()} onStreamEnd={onStreamEnd} />,
    );
    await screen.findByText("Resolving packages");
    expect(container.querySelector("[data-slot=terminal]")).toHaveAttribute(
      "data-status",
      "running",
    );
    expect(container.querySelector("[data-slot=terminal-cursor]")).not.toBeNull();
    await act(async () => release());
    await screen.findByText("Done in 2.1s");
    await waitFor(() => expect(onStreamEnd).toHaveBeenCalledTimes(1));
    expect(container.querySelector("[data-slot=terminal-cursor]")).toBeNull();
  });

  it("ticks a live clock while running and announces only the finish", () => {
    vi.useFakeTimers();
    const { container, rerender } = render(
      <Terminal command="pnpm build" status="running" lines={["Compiling…"]} />,
    );
    act(() => vi.advanceTimersByTime(3000));
    expect(container.querySelector("[data-slot=terminal-elapsed]")).toHaveTextContent("0:03");
    expect(screen.getByRole("status")).toHaveTextContent("");
    rerender(<Terminal command="pnpm build" status="failed" exitCode={1} lines={["Compiling…"]} />);
    expect(screen.getByRole("status")).toHaveTextContent("pnpm build failed, exit code 1");
    expect(container.querySelector("[data-slot=terminal-elapsed]")).toHaveTextContent("3.0s");
  });

  it("hangs wrapped lines under their text and keeps flags and package names whole", () => {
    const { container } = render(
      <Terminal
        command="npx -y @kura-ui/mcp"
        lines={["  └  ✓ src/auth/client.test.ts 42ms"]}
        status="done"
      />,
    );
    const line = container.querySelector<HTMLElement>("[data-slot=terminal-line]")!;
    // Past the indent and both markers: the continuation starts under "src".
    expect(line.style.paddingLeft).toBe("7ch");
    expect(line.style.textIndent).toBe("-7ch");
    // A path may break after each slash, and the text itself is untouched.
    expect(line.querySelectorAll("wbr")).toHaveLength(2);
    expect(line.textContent).toBe("  └  ✓ src/auth/client.test.ts 42ms");
    const command = container.querySelector("[data-slot=terminal-command]")!;
    expect([...command.querySelectorAll(".whitespace-nowrap")].map((e) => e.textContent)).toEqual([
      "-y",
      "@kura-ui/",
    ]);
  });

  it("leaves lines alone when wrapping is off", () => {
    const { container } = render(<Terminal lines={["  ✓ src/a-b.ts"]} wrap={false} />);
    const line = container.querySelector<HTMLElement>("[data-slot=terminal-line]")!;
    expect(line.style.paddingLeft).toBe("");
    expect(line.querySelector("wbr")).toBeNull();
  });

  it("gives each run its own clock", () => {
    vi.useFakeTimers();
    const { container, rerender } = render(<Terminal command="pnpm test" status="running" />);
    act(() => vi.advanceTimersByTime(4000));
    rerender(<Terminal command="pnpm test" status="done" exitCode={0} />);
    act(() => vi.advanceTimersByTime(20_000));
    // A second command starts from zero, not from when the first one began.
    rerender(<Terminal command="pnpm db:migrate" status="running" />);
    act(() => vi.advanceTimersByTime(2000));
    expect(container.querySelector("[data-slot=terminal-elapsed]")).toHaveTextContent("0:02");
    expect(screen.getByRole("status")).toHaveTextContent("pnpm db:migrate running");
  });

  it("collapses to the last lines and expands (controlled callback)", async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const lines = Array.from({ length: 30 }, (_, i) => `line ${i + 1}`);
    const { container } = render(
      <Terminal lines={lines} maxLines={5} onExpandedChange={onExpandedChange} />,
    );
    expect(container.querySelectorAll("[data-slot=terminal-line]")).toHaveLength(5);
    expect(screen.queryByText("line 25")).toBeNull();
    expect(screen.getByText("line 30")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show all 30 lines" }));
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(container.querySelectorAll("[data-slot=terminal-line]")).toHaveLength(30);
    await user.click(screen.getByRole("button", { name: "Show last 5 lines" }));
    expect(container.querySelectorAll("[data-slot=terminal-line]")).toHaveLength(5);
  });

  it("copies the command and plain output without escape codes", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const onCopy = vi.fn();
    render(<Terminal command="ls" lines={["\x1b[34msrc\x1b[39m  package.json"]} onCopy={onCopy} />);
    await user.click(screen.getByRole("button", { name: "Copy output" }));
    expect(writeText).toHaveBeenCalledWith("$ ls\nsrc  package.json");
    expect(onCopy).toHaveBeenCalledWith("$ ls\nsrc  package.json");
  });

  it("shows Jump to latest when scrolled up and returns to the bottom", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Terminal lines={["a", "b"]} />);
    const log = screen.getByRole("log");
    Object.defineProperty(log, "scrollHeight", { value: 1000, configurable: true });
    Object.defineProperty(log, "clientHeight", { value: 300, configurable: true });
    log.scrollTop = 100;
    act(() => {
      log.dispatchEvent(new Event("scroll"));
    });
    rerender(<Terminal lines={["a", "b", "c", "d"]} />);
    const jump = screen.getByRole("button", { name: "2 new lines" });
    await user.click(jump);
    expect(screen.queryByRole("button", { name: /new lines|Jump to latest/ })).toBeNull();
  });

  it("renders an empty state", () => {
    render(<Terminal />);
    expect(screen.getByText("No output")).toBeInTheDocument();
  });

  it("respects reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(
      <Terminal command="pnpm dev" status="running" lines={["ready"]} />,
    );
    expect(container.querySelector("[data-slot=terminal-cursor]")!.className).toContain(
      "motion-reduce:animate-none",
    );
    setReducedMotion(false);
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [TerminalMinimal, TerminalFull, TerminalCollapsed, TerminalComposition]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
