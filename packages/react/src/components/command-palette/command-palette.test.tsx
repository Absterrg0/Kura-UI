import { describe, expect, it, vi } from "vitest";
import {
  act,
  axe,
  fireEvent,
  render,
  screen,
  setReducedMotion,
  userEvent,
  waitFor,
} from "../../../test/utils";
import {
  CommandPalette,
  type CommandPaletteItem,
  CommandPaletteTrigger,
  scoreCommand,
} from "./command-palette";
import {
  CommandPaletteAsyncSearch,
  CommandPaletteFull,
  CommandPaletteMinimal,
} from "./command-palette.examples";

const run = vi.fn();
const items: CommandPaletteItem[] = [
  { id: "new", label: "New chat", group: "General", onSelect: () => run("new") },
  {
    id: "deploy",
    label: "Deploy preview",
    group: "General",
    keywords: ["ship"],
    onSelect: () => run("deploy"),
  },
  { id: "off", label: "Disabled thing", group: "General", disabled: true },
  {
    id: "theme",
    label: "Change theme…",
    group: "Settings",
    children: [
      { id: "light", label: "Light", onSelect: () => run("light") },
      { id: "dark", label: "Dark", onSelect: () => run("dark") },
    ],
  },
  {
    id: "wf",
    label: "Workflows…",
    group: "Settings",
    loadChildren: () =>
      Promise.resolve([{ id: "wf1", label: "Triage", onSelect: () => run("wf1") }]),
  },
];

const dialog = () => document.querySelector("[data-slot=command-palette]");

describe("CommandPalette", () => {
  it("toggles with ⌘/Ctrl+K and renders a labelled dialog with data-slot", async () => {
    render(<CommandPalette items={items} className="custom" />);
    expect(dialog()).toBeNull();
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    expect(await screen.findByRole("dialog", { name: "Command palette" })).toHaveAttribute(
      "data-slot",
      "command-palette",
    );
    expect(dialog()).toHaveClass("custom");
    expect(screen.getByRole("combobox", { name: "Search commands" })).toHaveFocus();
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    await waitFor(() => expect(dialog()).toBeNull());
  });

  it("fuzzy-filters, navigates (skipping disabled) and runs an item", async () => {
    run.mockClear();
    const onSelect = vi.fn();
    render(<CommandPalette items={items} defaultOpen onSelect={onSelect} />);
    const input = screen.getByRole("combobox");
    await userEvent.type(input, "ship");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    await userEvent.clear(input);
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(input.getAttribute("aria-activedescendant")).toBe(
      screen.getByRole("option", { name: /Change theme/ }).id,
    );
    await userEvent.keyboard("{ArrowUp}{Enter}");
    expect(run).toHaveBeenCalledWith("deploy");
    expect(onSelect).toHaveBeenCalledWith(items[1]);
    await waitFor(() => expect(dialog()).toBeNull());
  });

  it("opens nested pages, goes back with Backspace, and loads async pages", async () => {
    run.mockClear();
    render(<CommandPalette items={items} defaultOpen />);
    const input = screen.getByRole("combobox");
    await userEvent.click(screen.getByRole("option", { name: /Change theme/ }));
    expect(screen.getByRole("combobox", { name: "Search Change theme…" })).toBeInTheDocument();
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Light", "Dark"]);
    await userEvent.keyboard("{Backspace}");
    expect(screen.getByRole("option", { name: /New chat/ })).toBeInTheDocument();
    await userEvent.type(input, "work");
    await userEvent.keyboard("{Enter}");
    expect(await screen.findByRole("option", { name: /Triage/ })).toBeInTheDocument();
    await userEvent.keyboard("{Enter}");
    expect(run).toHaveBeenCalledWith("wf1");
  });

  it("shows recents first and tracks usage (controlled)", async () => {
    const onRecentChange = vi.fn();
    render(
      <CommandPalette
        items={items}
        defaultOpen
        recent={["light"]}
        onRecentChange={onRecentChange}
      />,
    );
    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveTextContent("Light");
    expect(screen.getByText("Recent")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("option", { name: /New chat/ }));
    expect(onRecentChange).toHaveBeenCalledWith(["new", "light"]);
  });

  it("shows loading rows and an empty message", () => {
    const { rerender } = render(<CommandPalette items={[]} defaultOpen loading />);
    expect(screen.getByRole("listbox")).toHaveAttribute("aria-busy", "true");
    expect(document.querySelector("[data-slot=command-palette-loading]")).toBeInTheDocument();
    rerender(<CommandPalette items={[]} defaultOpen emptyMessage="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("scores word-start and subsequence matches", () => {
    expect(scoreCommand("Deploy preview", "dep")).toBeGreaterThan(
      scoreCommand("Deploy preview", "prev"),
    );
    expect(scoreCommand("Deploy preview", "dpv")).toBeGreaterThan(0);
    expect(scoreCommand("Deploy preview", "xyz")).toBe(0);
  });

  it("skeleton pulse is removed under reduced motion", () => {
    setReducedMotion(true);
    render(<CommandPalette items={[]} defaultOpen loading />);
    const bar = document.querySelector("[data-slot=command-palette-loading] span")!;
    expect(bar.className).toContain("motion-reduce:animate-none");
  });

  it("the trigger prints a key only when it is given one", () => {
    const { container, rerender } = render(<CommandPaletteTrigger />);
    expect(container.querySelector("[data-slot=kbd]")).not.toBeNull();
    // A palette with no hotkey prints no key: `shortcut={null}`.
    rerender(<CommandPaletteTrigger shortcut={null} />);
    expect(container.querySelector("[data-slot=kbd]")).toBeNull();
  });

  it("examples render without a11y violations (closed and open)", async () => {
    for (const Example of [CommandPaletteMinimal, CommandPaletteFull, CommandPaletteAsyncSearch]) {
      const { container, unmount } = render(<Example />);
      await act(async () => {});
      await axe(container);
      unmount();
    }
    render(<CommandPalette items={items} defaultOpen />);
    await act(async () => {});
    await axe(document.body);
  });
});
