import { afterEach, describe, expect, it, vi } from "vitest";
import { act, axe, render, screen, setReducedMotion, userEvent } from "../../../test/utils";
import { BrowserSession, type BrowserStep } from "./browser-session";
import {
  BrowserSessionComposition,
  BrowserSessionFull,
  BrowserSessionMinimal,
  BrowserSessionPaused,
} from "./browser-session.examples";

const steps: BrowserStep[] = [
  {
    id: "a",
    kind: "navigate",
    label: "Open the compare view",
    status: "done",
    detail: "github.com",
  },
  { id: "b", kind: "click", label: "Click Create", status: "running" },
  { id: "c", kind: "extract", label: "Read the PR number", status: "queued" },
];

describe("BrowserSession", () => {
  afterEach(() => vi.useRealTimers());

  it("renders the frame, address bar and data-slot", () => {
    const { container } = render(
      <BrowserSession
        url="https://github.com/acme/web/pull/482"
        title="PR · acme/web"
        className="custom"
      >
        <p>Page</p>
      </BrowserSession>,
    );
    const root = container.querySelector("[data-slot=browser-session]")!;
    expect(root).toHaveClass("custom");
    expect(root).toHaveAttribute("data-status", "browsing");
    const address = screen.getByRole("group", { name: "Address" });
    expect(address).toHaveTextContent("github.com/acme/web/pull/482");
    expect(screen.getByLabelText("Secure connection")).toBeInTheDocument();
    expect(screen.getByText("Page")).toBeInTheDocument();
    expect(screen.getByText("Agent is browsing")).toBeInTheDocument();
  });

  it("draws the cursor, highlight and a ripple for click steps", () => {
    const { container } = render(
      <BrowserSession
        url="https://x.dev"
        cursor={{ x: 25, y: 50 }}
        cursorLabel="Kura"
        highlight={{ x: 10, y: 20, width: 30, height: 10, label: "button" }}
        steps={steps}
      />,
    );
    const cursor = container.querySelector<HTMLElement>("[data-slot=browser-session-cursor]")!;
    expect(cursor.style.left).toBe("25%");
    expect(cursor).toHaveTextContent("Kura");
    const hl = container.querySelector<HTMLElement>("[data-slot=browser-session-highlight]")!;
    expect(hl.style.width).toBe("30%");
    expect(container.querySelector("[data-slot=browser-session-ripple]")).toBeInTheDocument();
    expect(container.querySelector("[data-slot=browser-session-overlay]")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("renders the step log with the active step and announces it", () => {
    render(<BrowserSession url="https://x.dev" steps={steps} />);
    const log = screen.getByRole("list", { name: "Browser actions" });
    const items = log.querySelectorAll("li");
    expect(items).toHaveLength(3);
    expect(items[1]).toHaveAttribute("aria-current", "step");
    expect(items[1]).toHaveTextContent("Click Create (in progress)");
    expect(screen.getByRole("status")).toHaveTextContent("Click Create");
    expect(screen.getByText("1/3")).toBeInTheDocument();
  });

  it("shows the loading bar while navigating", () => {
    const { container } = render(
      <BrowserSession
        url="https://x.dev"
        steps={[{ id: "n", kind: "navigate", label: "Go", status: "running" }]}
      />,
    );
    expect(container.querySelector("[data-slot=browser-session-loading]")).toBeInTheDocument();
  });

  it("hands control back and forth", async () => {
    const user = userEvent.setup();
    const onTakeOver = vi.fn();
    const onResume = vi.fn();
    const { rerender } = render(
      <BrowserSession url="https://x.dev" onTakeOver={onTakeOver} onResume={onResume} />,
    );
    await user.click(screen.getByRole("button", { name: "Take over" }));
    expect(onTakeOver).toHaveBeenCalled();
    rerender(
      <BrowserSession
        url="https://x.dev"
        status="paused"
        statusText="Enter the 2FA code"
        onTakeOver={onTakeOver}
        onResume={onResume}
      />,
    );
    expect(screen.getByText("Paused for you")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Enter the 2FA code");
    await user.click(screen.getByRole("button", { name: "Resume agent" }));
    expect(onResume).toHaveBeenCalled();
  });

  it("ticks the elapsed clock while browsing", () => {
    vi.useFakeTimers();
    const { container } = render(
      <BrowserSession url="https://x.dev" startedAt={Date.now() - 61_000} />,
    );
    act(() => vi.advanceTimersByTime(1000));
    expect(container.querySelector("[data-slot=browser-session-elapsed]")).toHaveTextContent(
      "1:02",
    );
  });

  it("uses a screenshot with alt text", () => {
    render(<BrowserSession url="https://x.dev/a" src="/shot.png" />);
    expect(screen.getByRole("img", { name: "Screenshot of https://x.dev/a" })).toBeInTheDocument();
  });

  it("stops gliding and ripples under reduced motion", () => {
    setReducedMotion(true);
    const { container } = render(
      <BrowserSession url="https://x.dev" cursor={{ x: 1, y: 1 }} steps={steps} />,
    );
    expect(container.innerHTML).toContain("motion-reduce:transition-none");
  });

  it("examples render without a11y violations", async () => {
    for (const Example of [
      BrowserSessionMinimal,
      BrowserSessionFull,
      BrowserSessionPaused,
      BrowserSessionComposition,
    ]) {
      const { container, unmount } = render(<Example />);
      await axe(container);
      unmount();
    }
  });
});
