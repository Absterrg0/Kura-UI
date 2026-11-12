import { afterEach, describe, expect, it, vi } from "vitest";
import { axe, render, screen, setReducedMotion, userEvent, waitFor } from "../../../test/utils";
import { Citation, CitationCard, Sources, sourceDomain } from "./citation";
import {
  CitationFull,
  CitationInMessage,
  CitationMinimal,
  CitationSourcesList,
} from "./citation.examples";

const source = {
  title: "useOptimistic – React",
  url: "https://www.react.dev/reference/react/useOptimistic",
  snippet: "Optimistically update the UI.",
};

describe("Citation", () => {
  afterEach(() => vi.useRealTimers());

  it("renders a numbered link pill with a descriptive name and data-slot", () => {
    render(<Citation index={2} source={source} className="custom" />);
    const pill = screen.getByRole("link", { name: "Source 2: useOptimistic – React (react.dev)" });
    expect(pill).toHaveAttribute("data-slot", "citation");
    expect(pill).toHaveAttribute("href", source.url);
    expect(pill).toHaveAttribute("target", "_blank");
    expect(pill).toHaveClass("custom");
    expect(pill).toHaveTextContent("2");
  });

  // Closing when the pointer leaves needs real pointer geometry; the docs' Playwright run covers it.
  it("opens the preview on hover after the delay", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Citation index={1} source={source} openDelay={200} onOpenChange={onOpenChange} />);
    const pill = screen.getByRole("link");
    await user.hover(pill);
    expect(document.querySelector("[data-slot=citation-preview][data-open]")).toBeNull();
    await waitFor(() => expect(pill).toHaveAttribute("data-state", "open"));
    const preview = document.querySelector("[data-slot=citation-preview]")!;
    expect(preview).toHaveTextContent("Optimistically update the UI.");
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(false));
  });

  it("opens on keyboard focus without stealing focus, and Escape closes it", async () => {
    const user = userEvent.setup();
    render(<Citation index={1} source={source} />);
    await user.tab();
    const pill = screen.getByRole("link", { name: /Source 1/ });
    expect(pill).toHaveFocus();
    expect(await screen.findByText("Optimistically update the UI.")).toBeInTheDocument();
    expect(pill).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(pill).toHaveAttribute("data-state", "closed");
  });

  it("can show the domain instead of the number", () => {
    render(<Citation index={1} source={{ ...source, siteName: "React" }} display="domain" />);
    expect(screen.getByRole("link")).toHaveTextContent("React");
  });

  it("card and sources render titles, domains and numbering", () => {
    render(<CitationCard source={source} index={4} />);
    expect(screen.getByRole("link", { name: /useOptimistic – React/ })).toBeInTheDocument();
    expect(screen.getByText("react.dev")).toBeInTheDocument();
    const { container } = render(<Sources sources={[source, source]} variant="list" />);
    expect(container.querySelector("[data-slot=citation-sources]")).toHaveAttribute(
      "data-variant",
      "list",
    );
    expect(screen.getByRole("list", { name: /Sources/ }).children).toHaveLength(2);
    expect(sourceDomain("not a url")).toBe("not a url");
  });

  it("drops the arrow nudge under reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(<CitationCard source={source} />);
    expect(container.innerHTML).toContain("motion-reduce:transition-none");
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [CitationMinimal, CitationFull, CitationSourcesList, CitationInMessage]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  }, 20_000);
});
