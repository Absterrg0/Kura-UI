import { describe, expect, it, vi } from "vitest";
import { axe, render, screen, setReducedMotion, userEvent } from "../../../test/utils";
import { CodeBlock } from "./code-block";
import {
  CodeBlockComposition,
  CodeBlockDiff,
  CodeBlockFull,
  CodeBlockMinimal,
  CodeBlockStreaming,
} from "./code-block.examples";
import { highlightCode } from "./highlight";

const TS = 'const greeting: string = "hi";\n// done\nfunction run() {\n  return 42;\n}';

describe("CodeBlock", () => {
  it("renders highlighted code with a data-slot, header and className", () => {
    const { container } = render(
      <CodeBlock code={TS} language="ts" filename="greet.ts" className="custom" />,
    );
    const root = container.querySelector("[data-slot=code-block]")!;
    expect(root).toHaveClass("custom");
    expect(root).toHaveAttribute("data-language", "ts");
    expect(screen.getByText("greet.ts")).toBeInTheDocument();
    expect(container.querySelectorAll("[data-slot=code-block-line]")).toHaveLength(5);
    expect(screen.getByText("const").className).toContain("--kura-code-keyword");
    expect(screen.getByText('"hi"').className).toContain("--kura-code-string");
    expect(screen.getByText("// done").className).toContain("--kura-code-comment");
    expect(screen.getByRole("region", { name: "greet.ts code" })).toHaveAttribute("tabindex", "0");
  });

  it("tokenizes common languages", () => {
    const json = highlightCode('{"a": 1, "b": true}', "json").flat();
    expect(json.find((t) => t.text === '"a"')?.type).toBe("property");
    expect(json.find((t) => t.text === "true")?.type).toBe("constant");
    const sh = highlightCode("pnpm add -D vitest # test", "bash").flat();
    expect(sh.find((t) => t.text === "pnpm")?.type).toBe("function");
    expect(sh.find((t) => t.text === "-D")?.type).toBe("attr");
    expect(sh.find((t) => t.text === "# test")?.type).toBe("comment");
    const py = highlightCode("def run(x):\n    return None", "python");
    expect(py).toHaveLength(2);
    expect(py[0]!.find((t) => t.text === "run")?.type).toBe("function");
    expect(highlightCode("plain", "unknown-lang")).toEqual([[{ type: "plain", text: "plain" }]]);
  });

  it("copies the code and confirms", async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    render(<CodeBlock code="echo hi" language="bash" onCopy={onCopy} />);
    await user.click(screen.getByRole("button", { name: "Copy code" }));
    expect(await navigator.clipboard.readText()).toBe("echo hi");
    expect(onCopy).toHaveBeenCalledWith("echo hi");
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Copied to clipboard");
  });

  it("toggles wrap uncontrolled and controlled", async () => {
    const user = userEvent.setup();
    const onWrapChange = vi.fn();
    const { container, rerender } = render(<CodeBlock code="x" onWrapChange={onWrapChange} />);
    const root = container.firstElementChild!;
    const button = screen.getByRole("button", { name: "Wrap lines" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    await user.click(button);
    expect(root).toHaveAttribute("data-wrap", "true");
    expect(onWrapChange).toHaveBeenCalledWith(true);
    rerender(<CodeBlock code="x" wrap={false} onWrapChange={onWrapChange} />);
    expect(root).toHaveAttribute("data-wrap", "false");
  });

  it("renders line numbers, highlighted lines and diffs", () => {
    const { container } = render(
      <CodeBlock code={"@@ -1 +1 @@\n-old\n+new\n same"} diff lineNumbers highlightLines={[4]} />,
    );
    const lines = container.querySelectorAll("[data-slot=code-block-line]");
    expect(lines[0]).toHaveAttribute("data-diff", "meta");
    expect(lines[1]).toHaveAttribute("data-diff", "remove");
    expect(lines[2]).toHaveAttribute("data-diff", "add");
    expect(lines[3]).toHaveAttribute("data-highlighted", "true");
    expect(lines[2]).toHaveTextContent("added:");
    expect(container.querySelectorAll("[data-slot=code-block-line-number]")).toHaveLength(4);
  });

  it("keeps the unfinished last line unhighlighted while streaming", () => {
    const { container, rerender } = render(
      <CodeBlock code={'const a = 1;\nconst b = "unterm'} language="ts" streaming />,
    );
    const last = () => [...container.querySelectorAll("[data-slot=code-block-line]")].at(-1)!;
    expect(last().querySelector("[class*=--kura-code-string]")).toBeNull();
    expect(container.querySelector("[data-slot=code-block-caret]")).not.toBeNull();
    rerender(<CodeBlock code={'const a = 1;\nconst b = "unterminated";'} language="ts" />);
    expect(last().querySelector("[class*=--kura-code-string]")).not.toBeNull();
    expect(container.querySelector("[data-slot=code-block-caret]")).toBeNull();
  });

  it("collapses to maxHeight and expands", async () => {
    const user = userEvent.setup();
    const code = Array.from({ length: 40 }, (_, i) => `line ${i}`).join("\n");
    const { container } = render(<CodeBlock code={code} maxHeight={120} />);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute("data-state", "collapsed");
    await user.click(screen.getByRole("button", { name: /Show \d+ more lines/ }));
    expect(root).toHaveAttribute("data-state", "expanded");
    await user.click(screen.getByRole("button", { name: "Collapse code" }));
    expect(root).toHaveAttribute("data-state", "collapsed");
  });

  it("drops scale/blur and the caret loop under reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(<CodeBlock code="a" streaming />);
    expect(container.querySelector("[data-slot=code-block-caret]")!.className).toContain(
      "motion-reduce:animate-none",
    );
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [
      CodeBlockMinimal,
      CodeBlockFull,
      CodeBlockDiff,
      CodeBlockStreaming,
      CodeBlockComposition,
    ]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
