import { describe, expect, it, vi } from "vitest";
import { axe, render, screen, setReducedMotion, userEvent } from "../../../test/utils";
import { ArtifactCard, artifactKindLabel } from "./artifact-card";
import {
  ArtifactCardComposition,
  ArtifactCardFull,
  ArtifactCardKinds,
  ArtifactCardMinimal,
  ArtifactCardStates,
} from "./artifact-card.examples";

describe("ArtifactCard", () => {
  it("renders title, meta, data-slot and passes className through", () => {
    const { container } = render(
      <ArtifactCard title="Q3 plan" meta="Markdown · 900 words" className="custom" />,
    );
    const root = container.querySelector("[data-slot=artifact-card]")!;
    expect(root).toHaveClass("custom");
    expect(root).toHaveAttribute("data-kind", "document");
    expect(root).toHaveAttribute("data-status", "ready");
    expect(root).toHaveAttribute("data-variant", "compact");
    expect(screen.getByText("Markdown · 900 words")).toBeInTheDocument();
    // Without onOpen/href the title is plain text, not a control.
    expect(screen.queryByRole("button")).toBeNull();
    expect(container.querySelector("[data-slot=artifact-card-title]")).not.toBeNull();
  });

  it("opens with a button named by title and kind, and marks the selected card", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const { rerender } = render(<ArtifactCard title="limiter.ts" kind="code" onOpen={onOpen} />);
    const open = screen.getByRole("button", { name: "limiter.ts, Code" });
    await user.click(open);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(open).not.toHaveAttribute("aria-current");
    rerender(<ArtifactCard title="limiter.ts" kind="code" onOpen={onOpen} selected />);
    expect(screen.getByRole("button", { name: "limiter.ts, Code" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("renders a link for href", () => {
    render(<ArtifactCard title="Pricing" kind="web" href="/a/pricing" />);
    expect(screen.getByRole("link", { name: "Pricing, Web page" })).toHaveAttribute(
      "href",
      "/a/pricing",
    );
  });

  it("shows busy state with status text, progress and an announcement", () => {
    const { container, rerender } = render(
      <ArtifactCard title="Plan" status="generating" statusText="Writing…" progress={0.42} />,
    );
    const root = container.querySelector("[data-slot=artifact-card]")!;
    expect(root).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Writing…")).toBeInTheDocument();
    expect(screen.getByText("42%")).toBeInTheDocument();
    const bar = screen.getByRole("progressbar", { name: "Generating Plan" });
    expect(bar).toHaveAttribute("aria-valuenow", "42");
    expect(screen.getByRole("status")).toHaveTextContent("Generating Plan");

    rerender(<ArtifactCard title="Plan" status="updating" />);
    expect(screen.getByRole("progressbar", { name: "Updating Plan" })).not.toHaveAttribute(
      "aria-valuenow",
    );

    rerender(<ArtifactCard title="Plan" status="ready" />);
    expect(root).not.toHaveAttribute("aria-busy");
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("Plan ready");
  });

  it("shows the error and a Retry button", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ArtifactCard title="Page" status="error" error="Hit the limit" onRetry={onRetry} />);
    expect(screen.getByText("Hit the limit")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("switches versions uncontrolled, starting at the latest", async () => {
    const user = userEvent.setup();
    const onVersionChange = vi.fn();
    const { container } = render(
      <ArtifactCard title="Doc" versions={3} onVersionChange={onVersionChange} />,
    );
    const versions = container.querySelector("[data-slot=artifact-card-versions]")!;
    expect(versions).toHaveTextContent(/Version v3\/? of 3/);
    expect(screen.getByRole("button", { name: "Next version" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Previous version" }));
    expect(onVersionChange).toHaveBeenCalledWith(2);
    expect(versions).toHaveTextContent(/Version v2\/? of 3/);
  });

  it("respects a controlled version", async () => {
    const user = userEvent.setup();
    const onVersionChange = vi.fn();
    const { container } = render(
      <ArtifactCard title="Doc" versions={3} version={1} onVersionChange={onVersionChange} />,
    );
    await user.click(screen.getByRole("button", { name: "Next version" }));
    expect(onVersionChange).toHaveBeenCalledWith(2);
    expect(container.querySelector("[data-slot=artifact-card-versions]")).toHaveTextContent(
      /Version v1\/? of 3/,
    );
  });

  it("renders the preview area as decorative", () => {
    const { container } = render(
      <ArtifactCard title="Img" kind="image" variant="preview" preview={<p>thumb</p>} />,
    );
    const preview = container.querySelector("[data-slot=artifact-card-preview]")!;
    expect(preview).toHaveAttribute("aria-hidden", "true");
    expect(preview).toHaveAttribute("inert");
    expect(preview).toHaveTextContent("thumb");
    expect(artifactKindLabel("data")).toBe("Spreadsheet");
  });

  it("respects reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(
      <ArtifactCard title="Plan" status="generating" variant="preview" onOpen={() => {}} />,
    );
    const root = container.querySelector("[data-slot=artifact-card]")!;
    expect(root.className).toContain("motion-reduce:transition-none");
    const sweep = container.querySelector("[data-slot=artifact-card-progress] > div")!;
    expect(sweep.className).toContain("motion-reduce:animate-none");
    setReducedMotion(false);
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [
      ArtifactCardMinimal,
      ArtifactCardFull,
      ArtifactCardStates,
      ArtifactCardKinds,
      ArtifactCardComposition,
    ]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
