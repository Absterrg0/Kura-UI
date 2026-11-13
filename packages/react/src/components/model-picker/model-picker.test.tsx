import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { act, axe, render, screen, setReducedMotion, userEvent } from "../../../test/utils";
import { formatContextWindow, ModelPicker, type ModelPickerModel } from "./model-picker";
import {
  ModelPickerFull,
  ModelPickerInComposer,
  ModelPickerMinimal,
} from "./model-picker.examples";

const models: ModelPickerModel[] = [
  {
    id: "a",
    name: "Alpha",
    provider: "One",
    capabilities: ["vision"],
    contextWindow: 200_000,
    speed: 3,
    cost: 1,
    description: "Fast one",
  },
  { id: "b", name: "Beta", provider: "One", capabilities: ["reasoning"], disabled: true },
  {
    id: "c",
    name: "Gamma",
    provider: "Two",
    capabilities: ["tools", "reasoning"],
    description: "Thinks hard",
  },
  { id: "d", name: "Delta", provider: "Two" },
];

function Controlled() {
  const [value, setValue] = React.useState("d");
  return (
    <>
      <ModelPicker models={models} value={value} onValueChange={setValue} />
      <output>{value}</output>
    </>
  );
}

describe("ModelPicker", () => {
  it("renders the list in place with `inline` and keeps it after choosing", async () => {
    const onValueChange = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ModelPicker
        models={models}
        inline
        defaultValue="c"
        onValueChange={onValueChange}
        onOpenChange={onOpenChange}
      />,
    );
    expect(screen.queryByRole("button")).toBeNull();
    const root = screen.getByRole("group", { name: "Choose a model" });
    expect(root).toHaveAttribute("data-slot", "model-picker");
    expect(screen.getByRole("option", { name: /Gamma/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Thinks hard")).toBeInTheDocument();
    const list = screen.getByRole("listbox", { name: "Models" });
    expect(list).not.toHaveFocus();
    list.focus();
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("d", models[3]);
    expect(screen.getByRole("option", { name: /Delta/ })).toHaveAttribute("aria-selected", "true");
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("renders a labelled trigger with data-slot", () => {
    render(<ModelPicker models={models} className="custom" />);
    const trigger = screen.getByRole("button", { name: "Model: Alpha" });
    expect(trigger).toHaveAttribute("data-slot", "model-picker");
    expect(trigger).toHaveAttribute("data-state", "closed");
    expect(trigger).toHaveClass("custom");
  });

  it("opens a grouped listbox with metadata and selects with the keyboard", async () => {
    const onValueChange = vi.fn();
    render(<ModelPicker models={models} onValueChange={onValueChange} searchable />);
    await userEvent.click(screen.getByRole("button", { name: "Model: Alpha" }));
    const search = screen.getByRole("combobox", { name: "Search models" });
    expect(search).toHaveFocus();
    expect(screen.getByRole("listbox", { name: "Models" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "One" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Alpha/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("option", { name: /Alpha/ })).toHaveTextContent("200K");
    expect(screen.getByRole("option", { name: /Beta/ })).toHaveAttribute("aria-disabled", "true");

    // ArrowDown skips the disabled Beta.
    await userEvent.keyboard("{ArrowDown}");
    const gamma = screen.getByRole("option", { name: /Gamma/ });
    expect(search).toHaveAttribute("aria-activedescendant", gamma.id);
    expect(screen.getByText("Thinks hard")).toBeInTheDocument();
    await userEvent.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("c", models[2]);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Model: Gamma" })).toHaveFocus();
  });

  it("filters by name, provider or capability", async () => {
    render(<ModelPicker models={models} searchable defaultOpen />);
    await userEvent.type(screen.getByRole("combobox"), "reasoning");
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      expect.stringContaining("Beta"),
      expect.stringContaining("Gamma"),
    ]);
    await userEvent.clear(screen.getByRole("combobox"));
    await userEvent.type(screen.getByRole("combobox"), "zzz");
    expect(screen.getByText("No models match")).toBeInTheDocument();
  });

  it("supports a controlled value and pointer selection", async () => {
    render(<Controlled />);
    await userEvent.click(screen.getByRole("button", { name: "Model: Delta" }));
    await userEvent.click(screen.getByRole("option", { name: /Alpha/ }));
    expect(screen.getByRole("status")).toHaveTextContent("a");
  });

  it("navigates the listbox directly when not searchable", async () => {
    const onValueChange = vi.fn();
    render(<ModelPicker models={models} searchable={false} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Model: Alpha" }));
    expect(screen.getByRole("listbox")).toHaveFocus();
    await userEvent.keyboard("{End}{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("d", models[3]);
  });

  it("formats context windows", () => {
    expect(formatContextWindow(200_000)).toBe("200K");
    expect(formatContextWindow(1_000_000)).toBe("1M");
    expect(formatContextWindow(1_500_000)).toBe("1.5M");
  });

  it("under reduced motion the chevron does not rotate", () => {
    setReducedMotion(true);
    render(<ModelPicker models={models} />);
    const chevron = screen.getByRole("button").querySelector("svg.lucide")!;
    expect(chevron.getAttribute("class")).toContain("motion-reduce:transition-none");
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [ModelPickerMinimal, ModelPickerFull, ModelPickerInComposer]) {
      const { container, unmount } = render(<Example />);
      await act(async () => {});
      await axe(container);
      unmount();
    }
  });

  it("the open popover has no a11y violations", async () => {
    render(<ModelPicker models={models} searchable defaultOpen />);
    await act(async () => {});
    await axe(document.body);
  });
});
