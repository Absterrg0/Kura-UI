import { describe, expect, it, vi } from "vitest";
import {
  act,
  axe,
  fireEvent,
  render,
  screen,
  setReducedMotion,
  userEvent,
} from "../../../test/utils";
import { Attachment, AttachmentDropzone, AttachmentList } from "./attachment";
import { AttachmentFull, AttachmentMinimal, AttachmentWithDropzone } from "./attachment.examples";
import { acceptsFile, attachmentKind, formatBytes } from "./attachment-utils";

const items = [
  { id: "a", name: "a.pdf", type: "application/pdf", size: 1000 },
  { id: "b", name: "b.csv", type: "text/csv", size: 2048 },
  { id: "c", name: "c.ts", size: 10 },
  { id: "d", name: "d.md", size: 10 },
];

describe("Attachment", () => {
  it("renders a chip with name, extension and size", () => {
    render(<Attachment name="report.pdf" type="application/pdf" size={2_480_000} className="x" />);
    const root = screen.getByText("report.pdf").closest("[data-slot=attachment]")!;
    expect(root).toHaveAttribute("data-variant", "chip");
    expect(root).toHaveAttribute("data-kind", "pdf");
    expect(root).toHaveClass("x");
    expect(root).toHaveTextContent("PDF · 2.4 MB");
  });

  it("renders images with a preview as a thumbnail tile", () => {
    render(<Attachment name="cat.png" type="image/png" previewUrl="blob:cat" />);
    const img = screen.getByRole("img", { name: "cat.png" });
    expect(img.closest("[data-slot=attachment]")).toHaveAttribute("data-variant", "tile");
  });

  it("shows progress and errors, and calls remove/retry", async () => {
    const onRemove = vi.fn();
    const onRetry = vi.fn();
    const { rerender } = render(
      <Attachment name="a.csv" status="uploading" progress={0.42} onRemove={onRemove} />,
    );
    expect(screen.getByText("Uploading · 42%")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Remove a.csv" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
    rerender(<Attachment name="a.csv" status="error" error="Too large" onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Upload failed: Too large");
    await userEvent.click(screen.getByRole("button", { name: "Retry uploading a.csv" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("collapses overflow into a +N stack that expands on click", async () => {
    render(<AttachmentList items={items} max={2} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    const more = screen.getByRole("button", { name: "Show 2 more attachments" });
    expect(more).toHaveTextContent("+2");
    await userEvent.click(more);
    expect(screen.getByText("d.md")).toBeInTheDocument();
  });

  it("removes items from a list", async () => {
    const onRemove = vi.fn();
    render(<AttachmentList items={items} onRemove={onRemove} />);
    await userEvent.click(screen.getByRole("button", { name: "Remove b.csv" }));
    expect(onRemove).toHaveBeenCalledWith("b");
  });

  it("dropzone accepts and rejects dropped files", () => {
    const onFiles = vi.fn();
    render(<AttachmentDropzone onFiles={onFiles} accept="image/*" maxSize={100} />);
    const zone = document.querySelector("[data-slot=attachment-dropzone]")!;
    const ok = new File(["x"], "a.png", { type: "image/png" });
    const big = new File(["x".repeat(200)], "b.png", { type: "image/png" });
    const wrong = new File(["x"], "c.pdf", { type: "application/pdf" });
    const dataTransfer = { files: [ok, big, wrong], types: ["Files"], items: [] };
    fireEvent.dragEnter(zone, { dataTransfer });
    expect(zone).toHaveAttribute("data-dragging", "true");
    expect(screen.getByText("Release to attach")).toBeInTheDocument();
    fireEvent.drop(zone, { dataTransfer });
    expect(zone).not.toHaveAttribute("data-dragging");
    expect(onFiles).toHaveBeenCalledWith([ok], [big, wrong]);
  });

  it("dropzone ignores drags that carry no files", () => {
    render(<AttachmentDropzone onFiles={() => {}} />);
    const zone = document.querySelector("[data-slot=attachment-dropzone]")!;
    fireEvent.dragEnter(zone, { dataTransfer: { types: ["text/plain"], files: [] } });
    expect(zone).not.toHaveAttribute("data-dragging");
  });

  it("helpers classify and format", () => {
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(18_400_000)).toBe("18 MB");
    expect(attachmentKind("x.tsx")).toBe("code");
    expect(attachmentKind("x", "image/webp")).toBe("image");
    expect(acceptsFile({ name: "a.PDF", type: "" }, ".pdf")).toBe(true);
    expect(acceptsFile({ name: "a.txt", type: "text/plain" }, "image/*")).toBe(false);
  });

  it("under reduced motion the indeterminate ring holds still", () => {
    setReducedMotion(true);
    render(<Attachment name="a.csv" status="uploading" />);
    const dot = document.querySelector("[data-slot=attachment-progress] circle")!;
    expect(dot.getAttribute("class")).toContain("motion-reduce:animate-none");
    render(<AttachmentList items={items} />);
    expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0);
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [AttachmentMinimal, AttachmentFull, AttachmentWithDropzone]) {
      const { container, unmount } = render(<Example />);
      await act(async () => {});
      await axe(container);
      unmount();
    }
  });
});
