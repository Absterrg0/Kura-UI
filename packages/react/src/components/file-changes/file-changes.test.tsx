import { describe, expect, it, vi } from "vitest";
import { axe, render, screen, setReducedMotion, userEvent } from "../../../test/utils";
import { type FileChange, FileChanges } from "./file-changes";
import {
  FileChangesComposition,
  FileChangesFull,
  FileChangesList,
  FileChangesMinimal,
} from "./file-changes.examples";

const FILES: FileChange[] = [
  { path: "src/auth/client.ts", status: "M", additions: 13, deletions: 16 },
  { path: "src/auth/types.ts", status: "A", additions: 6, state: "editing" },
  { path: "src/middleware.ts", status: "M", additions: 2, deletions: 2 },
  { path: "src/lib/legacy-session.ts", status: "D", deletions: 10 },
  { path: "package.json", status: "M", additions: 1, deletions: 1 },
];

const rowNames = () =>
  screen.getAllByRole("treeitem").map((el) => el.querySelector("span.truncate")?.textContent);

describe("FileChanges", () => {
  it("renders a summary, a folder tree and data attributes", () => {
    const { container } = render(<FileChanges files={FILES} className="custom" />);
    const root = container.querySelector("[data-slot=file-changes]")!;
    expect(root).toHaveClass("custom");
    expect(root).toHaveAttribute("data-view", "tree");
    expect(screen.getByText("5 files")).toBeInTheDocument();
    expect(screen.getByText("+22")).toBeInTheDocument();
    expect(screen.getByText("−29")).toBeInTheDocument();
    expect(screen.getByRole("tree", { name: "Changes" })).toBeInTheDocument();
    // folders first, then files, alphabetical
    expect(rowNames()).toEqual([
      "src",
      "auth",
      "client.ts",
      "types.ts",
      "lib",
      "legacy-session.ts",
      "middleware.ts",
      "package.json",
    ]);
    const types = container.querySelector("[data-slot=file-changes-file][data-state=editing]")!;
    expect(types).toHaveTextContent("editing");
    expect(types.querySelector("[data-slot=status-glyph][data-status=running]")).not.toBeNull();
    expect(container.querySelector("[data-status=D]")).toHaveAccessibleName(/deleted/);
  });

  it("compacts single-child folder chains", () => {
    render(<FileChanges files={[{ path: "apps/web/src/app/page.tsx", status: "M" }]} />);
    expect(rowNames()).toEqual(["apps/web/src/app", "page.tsx"]);
  });

  it("selects files with click and keyboard (uncontrolled + onSelect)", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<FileChanges files={FILES} onSelect={onSelect} />);
    await user.click(screen.getByRole("treeitem", { name: /middleware\.ts/ }));
    expect(onSelect).toHaveBeenCalledWith("src/middleware.ts");
    expect(screen.getByRole("treeitem", { name: /middleware\.ts/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenLastCalledWith("package.json");
  });

  it("navigates and collapses folders with arrow keys", async () => {
    const user = userEvent.setup();
    render(<FileChanges files={FILES} />);
    const src = screen.getAllByRole("treeitem")[0]!;
    src.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getAllByRole("treeitem")[1]).toHaveFocus(); // into "auth"
    await user.keyboard("{ArrowLeft}");
    expect(screen.getAllByRole("treeitem")[1]).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("treeitem", { name: /client\.ts/ })).toBeNull();
    // collapsed folder shows its file count and a live marker for the edited file inside
    expect(screen.getByRole("img", { name: "contains a file being edited" })).toBeInTheDocument();
    await user.keyboard("{ArrowLeft}");
    expect(src).toHaveFocus(); // to the parent
    await user.keyboard("{End}");
    expect(screen.getAllByRole("treeitem").at(-1)).toHaveFocus();
    await user.keyboard("{Home}");
    expect(src).toHaveFocus();
    await user.keyboard(" ");
    expect(src).toHaveAttribute("aria-expanded", "false");
  });

  it("switches to a flat list (controlled view callback) and supports controlled selection", async () => {
    const user = userEvent.setup();
    const onViewChange = vi.fn();
    render(<FileChanges files={FILES} onViewChange={onViewChange} selectedPath="package.json" />);
    await user.click(screen.getByRole("button", { name: "List view" }));
    expect(onViewChange).toHaveBeenCalledWith("list");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(5);
    expect(screen.getByRole("option", { name: /package\.json/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    // controlled: clicking another file does not move the selection by itself
    await user.click(screen.getByRole("option", { name: /client\.ts/ }));
    expect(screen.getByRole("option", { name: /package\.json/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("renders an empty state", () => {
    render(<FileChanges files={[]} />);
    expect(screen.getByText("No changes yet")).toBeInTheDocument();
    expect(screen.queryByRole("tree")).toBeNull();
  });

  it("respects reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(<FileChanges files={FILES} />);
    const row = container.querySelector("[data-slot=file-changes-file]")!;
    expect(row.className).toContain("motion-reduce:transition-none");
    setReducedMotion(false);
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [
      FileChangesMinimal,
      FileChangesFull,
      FileChangesList,
      FileChangesComposition,
    ]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
