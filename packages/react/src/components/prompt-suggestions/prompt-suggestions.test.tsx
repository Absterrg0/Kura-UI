import { describe, expect, it, vi } from "vitest";
import { act, axe, render, screen, setReducedMotion, userEvent } from "../../../test/utils";
import { PromptSuggestions } from "./prompt-suggestions";
import {
  PromptSuggestionsEmptyChat,
  PromptSuggestionsFull,
  PromptSuggestionsMinimal,
} from "./prompt-suggestions.examples";

const items = [
  { title: "Plan a trip", description: "to Kyoto" },
  { id: "x", title: "Explain", prompt: "Explain closures in JS" },
];

describe("PromptSuggestions", () => {
  it("renders a labelled list with data-slot and variant", () => {
    render(<PromptSuggestions suggestions={items} className="custom" variant="list" />);
    const list = screen.getByRole("list", { name: "Suggestions" });
    expect(list).toHaveAttribute("data-slot", "prompt-suggestions");
    expect(list).toHaveAttribute("data-variant", "list");
    expect(list).toHaveClass("custom");
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("calls onSelect with the prompt (defaulting to title + description)", async () => {
    const onSelect = vi.fn();
    render(<PromptSuggestions suggestions={items} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("button", { name: /Plan a trip/ }));
    expect(onSelect).toHaveBeenLastCalledWith("Plan a trip to Kyoto", items[0]);
    await userEvent.click(screen.getByRole("button", { name: /Explain/ }));
    expect(onSelect).toHaveBeenLastCalledWith("Explain closures in JS", items[1]);
  });

  it("chips show titles only; disabled disables every button", () => {
    render(<PromptSuggestions suggestions={items} variant="chips" disabled />);
    expect(screen.queryByText("to Kyoto")).not.toBeInTheDocument();
    for (const b of screen.getAllByRole("button")) expect(b).toBeDisabled();
  });

  it("fills a composer and focuses it", async () => {
    render(<PromptSuggestionsEmptyChat />);
    await userEvent.click(
      screen.getByRole("button", { name: /Write tests for the billing service/ }),
    );
    const input = screen.getByRole("textbox", { name: "Message" });
    expect(input).toHaveValue("Write tests for the billing service");
    expect(input).toHaveFocus();
  });

  it("renders without travel under reduced motion", () => {
    setReducedMotion(true);
    render(<PromptSuggestions suggestions={items} />);
    const li = screen.getAllByRole("listitem")[0]!;
    expect(li.style.transform === "" || li.style.transform === "none").toBe(true);
    expect(screen.getAllByRole("button")[0]!.className).toContain("motion-reduce:transform-none");
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [
      PromptSuggestionsMinimal,
      PromptSuggestionsFull,
      PromptSuggestionsEmptyChat,
    ]) {
      const { container, unmount } = render(<Example />);
      await act(async () => {});
      await axe(container);
      unmount();
    }
  });
});
