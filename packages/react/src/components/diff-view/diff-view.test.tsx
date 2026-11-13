import { createAgent } from "@ui-sdk/react/agent";
import { describe, expect, it, vi } from "vitest";
import { axe, render, screen, setReducedMotion, userEvent, within } from "../../../test/utils";
import { type DiffReview, DiffView, normalizeFiles, parseUnifiedDiff, wordDiff } from "./diff-view";
import {
  DiffViewComposition,
  DiffViewFull,
  DiffViewMinimal,
  DiffViewStructured,
} from "./diff-view.examples";

const TWO_FILES = `diff --git a/src/a.ts b/src/a.ts
index 1111111..2222222 100644
--- a/src/a.ts
+++ b/src/a.ts
@@ -1,3 +1,3 @@
 const a = 1;
-const b = 2;
+const b = 3;
 const c = 4;
@@ -10,2 +10,3 @@ function tail() {
 x();
+y();
 z();
diff --git a/src/b.ts b/src/b.ts
new file mode 100644
index 0000000..3333333
--- /dev/null
+++ b/src/b.ts
@@ -0,0 +1,2 @@
+export const b = true;
+export const c = false;
`;

describe("parseUnifiedDiff", () => {
  it("parses files, statuses, hunks and line numbers", () => {
    const files = parseUnifiedDiff(TWO_FILES);
    expect(files.map((f) => [f.path, f.status, f.hunks.length])).toEqual([
      ["src/a.ts", "modified", 2],
      ["src/b.ts", "added", 1],
    ]);
    const [h1, h2] = files[0]!.hunks;
    expect(h1!.lines.map((l) => [l.kind, l.oldNumber, l.newNumber])).toEqual([
      ["context", 1, 1],
      ["remove", 2, undefined],
      ["add", undefined, 2],
      ["context", 3, 3],
    ]);
    expect(h2).toMatchObject({ oldStart: 10, newStart: 10, oldLines: 2, newLines: 3 });
    expect(h2!.section).toBe("function tail() {");
    expect(h2!.lines[1]).toEqual({ kind: "add", content: "y();", newNumber: 11 });
    expect(files[1]!.hunks[0]!.lines.every((l) => l.kind === "add")).toBe(true);
  });

  it("treats removed lines that look like headers as removals (count-driven)", () => {
    const files = parseUnifiedDiff(`--- a/schema.sql
+++ b/schema.sql
@@ -1,3 +1,2 @@
--- legacy sessions table
--- a/old
 CREATE TABLE users (id int);
+-- keep
`);
    // counts say 3 old / 2 new: two removals, one context, one addition
    expect(files).toHaveLength(1);
    expect(files[0]!.hunks[0]!.lines.map((l) => [l.kind, l.content])).toEqual([
      ["remove", "-- legacy sessions table"],
      ["remove", "-- a/old"],
      ["context", "CREATE TABLE users (id int);"],
      ["add", "-- keep"],
    ]);
  });

  it("defaults omitted hunk counts to 1 and handles '\\ No newline at end of file'", () => {
    const [file] = parseUnifiedDiff(`--- a/VERSION
+++ b/VERSION
@@ -1 +1 @@
-1.4.0
\\ No newline at end of file
+1.5.0
\\ No newline at end of file
`);
    const lines = file!.hunks[0]!.lines;
    expect(file!.hunks[0]).toMatchObject({ oldLines: 1, newLines: 1 });
    expect(lines.map((l) => [l.kind, l.content, l.noNewline])).toEqual([
      ["remove", "1.4.0", true],
      ["add", "1.5.0", true],
    ]);
  });

  it("normalizes CRLF line endings", () => {
    const [file] = parseUnifiedDiff(
      "--- a/x.txt\r\n+++ b/x.txt\r\n@@ -1,2 +1,2 @@\r\n keep\r\n-old\r\n+new\r\n",
    );
    expect(file!.hunks[0]!.lines.map((l) => l.content)).toEqual(["keep", "old", "new"]);
  });

  it("parses plain diff -u output with timestamps", () => {
    const [file] = parseUnifiedDiff(`--- src/app.py\t2026-11-08 10:00:00.000000000 +0000
+++ src/app.py\t2026-11-08 10:02:13.000000000 +0000
@@ -4,2 +4,2 @@
-DEBUG = True
+DEBUG = False
 PORT = 8080
`);
    expect(file).toMatchObject({ path: "src/app.py", status: "modified" });
    expect(file!.hunks[0]!.lines[0]).toMatchObject({ kind: "remove", oldNumber: 4 });
  });

  it("handles deletions, renames without content changes and binary files", () => {
    const files = parseUnifiedDiff(`diff --git a/src/lib/legacy.ts b/src/lib/legacy.ts
deleted file mode 100644
index f0ae86d..0000000
--- a/src/lib/legacy.ts
+++ /dev/null
@@ -1,2 +0,0 @@
-export const legacy = 1;
-export const old = 2;
diff --git a/src/auth/session.ts b/src/auth/session-store.ts
similarity index 100%
rename from src/auth/session.ts
rename to src/auth/session-store.ts
diff --git a/public/og.png b/public/og.png
index 1a2b3c4..5d6e7f8 100644
Binary files a/public/og.png and b/public/og.png differ
`);
    expect(files.map((f) => [f.path, f.status, f.oldPath, f.binary])).toEqual([
      ["src/lib/legacy.ts", "deleted", undefined, undefined],
      ["src/auth/session-store.ts", "renamed", "src/auth/session.ts", undefined],
      ["public/og.png", "modified", undefined, true],
    ]);
    expect(files[1]!.hunks).toEqual([]);
    expect(files[0]!.hunks[0]!.lines.map((l) => l.oldNumber)).toEqual([1, 2]);
  });

  it("parses paths with spaces and git's quoted, octal-escaped names", () => {
    const files = parseUnifiedDiff(`diff --git a/docs/read me.md b/docs/read me.md
--- a/docs/read me.md
+++ b/docs/read me.md
@@ -1 +1 @@
-hi
+hello
diff --git "a/caf\\303\\251 menu.ts" "b/caf\\303\\251 menu.ts"
new file mode 100644
--- /dev/null
+++ "b/caf\\303\\251 menu.ts"
@@ -0,0 +1 @@
+export {};
`);
    expect(files.map((f) => f.path)).toEqual(["docs/read me.md", "café menu.ts"]);
    expect(files[1]!.status).toBe("added");
  });

  it("recovers from wrong hunk counts without swallowing the next file", () => {
    const files = parseUnifiedDiff(`--- a/one.ts
+++ b/one.ts
@@ -1,9 +1,9 @@
-a
+b
--- a/two.ts
+++ b/two.ts
@@ -1 +1 @@
-c
+d
`);
    expect(files.map((f) => f.path)).toEqual(["one.ts", "two.ts"]);
    expect(files[0]!.hunks[0]).toMatchObject({ oldLines: 1, newLines: 1 });
    expect(files[1]!.hunks[0]!.lines).toHaveLength(2);
  });

  it("keeps blank context lines whose leading space was stripped", () => {
    const [file] = parseUnifiedDiff(
      ["--- a/x.ts", "+++ b/x.ts", "@@ -1,3 +1,3 @@", " a", "", "-b", "+c", ""].join("\n"),
    );
    expect(file!.hunks[0]!.lines.map((l) => l.kind)).toEqual([
      "context",
      "context",
      "remove",
      "add",
    ]);
  });

  it("ignores commit headers and returns [] for empty or junk input", () => {
    const files = parseUnifiedDiff(`From 3f2a1c Mon Sep 17 00:00:00 2001
From: Kura <kura@acme.dev>
Subject: [PATCH] auth: migrate to @acme/auth

---
 src/a.ts | 2 +-
 1 file changed

diff --git a/src/a.ts b/src/a.ts
--- a/src/a.ts
+++ b/src/a.ts
@@ -1 +1 @@
-x
+y
--
2.47.0
`);
    expect(files.map((f) => f.path)).toEqual(["src/a.ts"]);
    expect(files[0]!.hunks[0]!.lines).toHaveLength(2);
    expect(parseUnifiedDiff("")).toEqual([]);
    expect(parseUnifiedDiff("not a diff\nat all")).toEqual([]);
  });
});

describe("normalizeFiles and wordDiff", () => {
  it("accepts raw +/-/space strings and numbers them from the hunk start", () => {
    const [file] = normalizeFiles([
      { path: "a.ts", hunks: [{ oldStart: 5, lines: [" keep", "-old", "+new", "+more"] }] },
    ]);
    expect(file!.status).toBe("modified");
    expect(file!.hunks[0]!.lines.map((l) => [l.kind, l.oldNumber, l.newNumber])).toEqual([
      ["context", 5, 5],
      ["remove", 6, undefined],
      ["add", undefined, 6],
      ["add", undefined, 7],
    ]);
    expect(file!.hunks[0]).toMatchObject({ oldLines: 2, newLines: 3 });
  });

  it("marks only the words that changed, and gives up on unrelated lines", () => {
    const d = wordDiff("return session.expiresAt < now;", "return session.expiresAt <= now;");
    expect(d).not.toBeNull();
    const pick = (s: string, r: Array<[number, number]>) => r.map(([a, b]) => s.slice(a, b));
    expect(pick("return session.expiresAt < now;", d!.old)).toEqual(["<"]);
    expect(pick("return session.expiresAt <= now;", d!.new)).toEqual(["<="]);
    expect(wordDiff("import x from 'y';", "while (true) { go(); }")).toBeNull();
  });
});

describe("DiffView", () => {
  it("an agent can read the review and accept or reject each change by name", async () => {
    const agent = createAgent();
    const onReviewChange = vi.fn();
    render(<DiffView diff={TWO_FILES} onReviewChange={onReviewChange} />);
    const entry = agent.snapshot().find((e) => e.component === "diff-view");
    expect(entry?.label).toBe("Changes");
    expect(entry?.value).toBe("0 of 3 reviewed");
    expect(entry?.actions).toEqual(["accept", "reject", "undo", "acceptAll", "rejectAll"]);

    const act = (action: string, ...args: string[]) =>
      agent.act({ steps: [{ ref: "Changes", action, args }] });
    let result = await act("reject", "src/a.ts change 2");
    expect(result.ok, result.error?.message).toBe(true);
    expect(onReviewChange).toHaveBeenLastCalledWith(
      { "src/a.ts#1": "rejected" },
      expect.objectContaining({ decision: "rejected", source: "agent" }),
    );
    result = await act("acceptAll");
    expect(result.ok, result.error?.message).toBe(true);
    expect(agent.snapshot().find((e) => e.component === "diff-view")?.value).toBe(
      "3 of 3 reviewed",
    );
    expect((await act("accept", "src/zzz.ts change 9")).ok).toBe(false);
  });

  it("renders files, summary and data attributes", () => {
    const { container } = render(<DiffView diff={TWO_FILES} className="custom" />);
    const root = container.querySelector("[data-slot=diff-view]")!;
    expect(root).toHaveClass("custom");
    expect(root).toHaveAttribute("data-state", "pending");
    expect(screen.getByText("2 files")).toBeInTheDocument();
    expect(screen.getByText("0 of 3 reviewed")).toBeInTheDocument();
    const files = container.querySelectorAll("[data-slot=diff-view-file]");
    expect([...files].map((f) => f.getAttribute("data-status"))).toEqual(["modified", "added"]);
    expect(container.querySelectorAll("[data-slot=diff-view-hunk]")).toHaveLength(3);
    expect(container.querySelectorAll("[data-kind=add]")).toHaveLength(4);
  });

  it("accepts and rejects hunks with buttons and reports the change", async () => {
    const user = userEvent.setup();
    const onReviewChange = vi.fn();
    const { container } = render(
      <DiffView diff={TWO_FILES} onReviewChange={onReviewChange} collapseReviewed={false} />,
    );
    const first = container.querySelector<HTMLElement>("[data-hunk-id='src/a.ts#0']")!;
    await user.click(within(first).getByRole("button", { name: /Accept/ }));
    expect(first).toHaveAttribute("data-review", "accepted");
    expect(onReviewChange).toHaveBeenLastCalledWith(
      { "src/a.ts#0": "accepted" },
      { path: "src/a.ts", hunkIds: ["src/a.ts#0"], decision: "accepted" },
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Accepted hunk in src/a.ts. 1 of 3 reviewed.",
    );
    // Undo returns it to pending.
    await user.click(within(first).getByRole("button", { name: "Undo decision" }));
    expect(first).toHaveAttribute("data-review", "pending");
    const second = container.querySelector<HTMLElement>("[data-hunk-id='src/a.ts#1']")!;
    await user.click(within(second).getByRole("button", { name: /Reject/ }));
    expect(second).toHaveAttribute("data-review", "rejected");
  });

  it("reviews with the keyboard: j/k move, a/r decide and advance, u undoes", async () => {
    const user = userEvent.setup();
    const { container } = render(<DiffView diff={TWO_FILES} collapseReviewed={false} />);
    const hunk = (id: string) => container.querySelector<HTMLElement>(`[data-hunk-id='${id}']`)!;
    hunk("src/a.ts#0").focus();
    await user.keyboard("j");
    expect(hunk("src/a.ts#1")).toHaveFocus();
    await user.keyboard("k");
    expect(hunk("src/a.ts#0")).toHaveFocus();
    await user.keyboard("a");
    expect(hunk("src/a.ts#0")).toHaveAttribute("data-review", "accepted");
    expect(hunk("src/a.ts#1")).toHaveFocus(); // advanced to the next pending hunk
    await user.keyboard("r");
    expect(hunk("src/a.ts#1")).toHaveAttribute("data-review", "rejected");
    expect(hunk("src/b.ts#0")).toHaveFocus();
    await user.keyboard("k");
    await user.keyboard("u");
    expect(hunk("src/a.ts#1")).toHaveAttribute("data-review", "pending");
    // Only the focused hunk is a tab stop.
    expect(hunk("src/a.ts#1")).toHaveAttribute("tabindex", "0");
    expect(hunk("src/a.ts#0")).toHaveAttribute("tabindex", "-1");
  });

  it("accepts a whole file and collapses it; Accept all finishes the review", async () => {
    const user = userEvent.setup();
    const { container } = render(<DiffView diff={TWO_FILES} />);
    await user.click(screen.getByRole("button", { name: "Accept file src/a.ts" }));
    const fileA = container.querySelector("[data-slot=diff-view-file]")!;
    expect(fileA).toHaveAttribute("data-state", "closed");
    expect(screen.getByRole("button", { name: /src\/a\.ts/, expanded: false })).toBeInTheDocument();
    expect(screen.getByText("2 of 3 reviewed")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Accept all" }));
    expect(container.querySelector("[data-slot=diff-view]")).toHaveAttribute(
      "data-state",
      "reviewed",
    );
    expect(screen.queryByRole("button", { name: "Accept all" })).toBeNull();
  });

  it("supports controlled review and collapsed state", async () => {
    const user = userEvent.setup();
    const review: DiffReview = { "src/b.ts#0": "rejected" };
    const onCollapsedChange = vi.fn();
    const onReviewChange = vi.fn();
    const { container } = render(
      <DiffView
        diff={TWO_FILES}
        review={review}
        onReviewChange={onReviewChange}
        collapsed={[]}
        onCollapsedChange={onCollapsedChange}
      />,
    );
    expect(container.querySelector("[data-hunk-id='src/b.ts#0']")).toHaveAttribute(
      "data-review",
      "rejected",
    );
    const first = container.querySelector<HTMLElement>("[data-hunk-id='src/a.ts#0']")!;
    await user.click(within(first).getByRole("button", { name: /Accept/ }));
    // Controlled: not applied until the parent passes it back.
    expect(first).toHaveAttribute("data-review", "pending");
    expect(onReviewChange).toHaveBeenCalledWith(
      { "src/b.ts#0": "rejected", "src/a.ts#0": "accepted" },
      expect.objectContaining({ decision: "accepted" }),
    );
    await user.click(screen.getByRole("button", { name: /src\/b\.ts/ }));
    expect(onCollapsedChange).toHaveBeenCalledWith(["src/b.ts"]);
  });

  it("hides review controls when not reviewable and shows an empty state", () => {
    const { rerender } = render(<DiffView diff={TWO_FILES} reviewable={false} />);
    expect(screen.queryByRole("button", { name: /Accept/ })).toBeNull();
    rerender(<DiffView diff="" />);
    expect(screen.getByText("No changes")).toBeInTheDocument();
  });

  it("renders a footer inside the sheet only when given", () => {
    const { container, rerender } = render(<DiffView diff={TWO_FILES} />);
    expect(container.querySelector("[data-slot=diff-view-footer]")).toBeNull();
    rerender(<DiffView diff={TWO_FILES} footer={<button type="button">Apply</button>} />);
    const footer = container.querySelector("[data-slot=diff-view-footer]")!;
    expect(container.querySelector("[data-slot=diff-view]")).toContainElement(
      footer as HTMLElement,
    );
    expect(
      within(footer as HTMLElement).getByRole("button", { name: "Apply" }),
    ).toBeInTheDocument();
  });

  it("highlights syntax and changed words", () => {
    const { container } = render(
      <DiffView
        files={[{ path: "a.ts", hunks: [{ lines: ["-return a < b;", "+return a <= b;"] }] }]}
      />,
    );
    const add = container.querySelector("[data-kind=add]")!;
    expect(add.querySelector(".text-\\(--kura-code-keyword\\)")).toHaveTextContent("return");
    expect(add.querySelector("[class*='bg-kura-success/25']")).toHaveTextContent("<=");
  });

  it("respects reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(<DiffView diff={TWO_FILES} />);
    const line = container.querySelector("[data-slot=diff-view-line]")!;
    expect(line.className).toContain("motion-reduce:transition-none");
    setReducedMotion(false);
  });

  it("a renamed file keeps its new name; where it came from steps aside first", () => {
    const { container } = render(
      <DiffView
        files={[
          {
            path: "src/auth/session-store.ts",
            oldPath: "src/auth/session.ts",
            status: "renamed",
            hunks: [],
          },
        ]}
      />,
    );
    const path = container.querySelector("[data-slot=diff-view-path]")!;
    // Read out in full; shown only when the header has room for it.
    expect(path).toHaveTextContent("src/auth/session.ts renamed to");
    const old = [...path.querySelectorAll("[aria-hidden]")].find(
      (el) => el.textContent === "src/auth/session.ts",
    )!;
    expect(old.className).toContain("hidden");
    expect(old.className).toContain("shrink-[999]");
    // The new file name is its own piece, after the directory that truncates before it.
    expect(path.lastElementChild).toHaveTextContent("session-store.ts");
    expect(path.lastElementChild?.textContent).toBe("session-store.ts");
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [
      DiffViewMinimal,
      DiffViewFull,
      DiffViewStructured,
      DiffViewComposition,
    ]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  }, 20_000);
});
