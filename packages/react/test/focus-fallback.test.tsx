import * as React from "react";
import { describe, expect, it } from "vitest";
import { AttachmentList } from "../src/components/attachment";
import { BrowserSession } from "../src/components/browser-session";
import { Button } from "../src/components/button";
import { DiffView } from "../src/components/diff-view";
import { PromptQueue } from "../src/components/prompt-queue";
import { RunHeader } from "../src/components/run-header";
import { Terminal } from "../src/components/terminal";
import { ToolCall } from "../src/components/tool-call";
import { render, screen, userEvent, waitFor } from "./utils";

/**
 * Guard: pressing a control that then leaves the page must not drop keyboard focus to <body>.
 * Each widget keeps it: on what replaced the control, on a neighbour, or on its own root.
 */
const kept = (slot: string) =>
  waitFor(() => {
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement?.closest(`[data-slot=${slot}]`)).not.toBeNull();
  });

const press = async (name: string | RegExp) => {
  const user = userEvent.setup();
  screen.getByRole("button", { name }).focus();
  await user.keyboard("{Enter}");
};

const PATCH = `diff --git a/a.ts b/a.ts
--- a/a.ts
+++ b/a.ts
@@ -1,2 +1,2 @@
-const a = 1;
+const a = 2;
 export { a };
`;

function Run() {
  const [status, setStatus] = React.useState<"running" | "skipped">("running");
  return (
    <RunHeader
      title="Migrate"
      status={status}
      shortcuts={false}
      onStop={() => setStatus("skipped")}
    />
  );
}

function Session() {
  const [status, setStatus] = React.useState<"paused" | "browsing">("paused");
  return (
    <BrowserSession
      url="https://x.dev"
      status={status}
      onResume={() => setStatus("browsing")}
      onTakeOver={() => setStatus("paused")}
    />
  );
}

function Files() {
  const [items, setItems] = React.useState([
    { id: "a", name: "a.pdf", type: "application/pdf", size: 1000 },
    { id: "b", name: "b.csv", type: "text/csv", size: 2000 },
  ]);
  return (
    <AttachmentList items={items} onRemove={(id) => setItems(items.filter((i) => i.id !== id))} />
  );
}

function Call() {
  const [status, setStatus] = React.useState<"awaiting-approval" | "success">("awaiting-approval");
  return (
    <ToolCall
      name="run_command"
      status={status}
      args={{ command: "ls" }}
      actions={
        status === "awaiting-approval" ? (
          <Button onClick={() => setStatus("success")}>Approve</Button>
        ) : undefined
      }
    />
  );
}

describe("focus stays in the widget when the pressed control leaves", () => {
  it("PromptQueue: Remove and Send now move to the prompt that took the row's place", async () => {
    render(
      <PromptQueue
        defaultItems={[
          { id: "a", text: "First" },
          { id: "b", text: "Second" },
          { id: "c", text: "Third" },
        ]}
        onSendNow={() => {}}
      />,
    );
    const user = userEvent.setup();
    const rows = () => [...document.querySelectorAll<HTMLElement>("[data-slot=prompt-queue-item]")];
    rows()[0]!.querySelector<HTMLElement>("button[aria-label=Remove]")!.focus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(rows()[0]).toHaveFocus());
    expect(rows()).toHaveLength(2);
    rows()[1]!.querySelector<HTMLElement>("[data-slot=prompt-queue-send]")!.focus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(rows()[0]).toHaveFocus());
    expect(rows()).toHaveLength(1);
  });

  it("PromptQueue: Move down keeps the key in hand, and the last prompt leaves a place to stand", async () => {
    render(
      <PromptQueue
        defaultItems={[
          { id: "a", text: "First" },
          { id: "b", text: "Second" },
        ]}
      />,
    );
    const user = userEvent.setup();
    const rows = () => [...document.querySelectorAll<HTMLElement>("[data-slot=prompt-queue-item]")];
    // Reordering re-inserts the row; the key that was pressed gets its focus back.
    rows()[0]!.querySelector<HTMLElement>("button[aria-label='Move down']")!.focus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(rows()[1]).toHaveAttribute("aria-label", "2 of 2: First"));
    // "First" is now last: its Move down key keeps focus and reads as unavailable.
    const key = () => rows()[1]!.querySelector<HTMLElement>("button[aria-label='Move down']");
    await waitFor(() => expect(key()).toHaveFocus());
    expect(key()).toHaveAttribute("aria-disabled", "true");
    // Remove both: when the queue is empty, focus rests on the status line it leaves behind.
    for (let i = 0; i < 2; i++) {
      rows()[0]!.querySelector<HTMLElement>("button[aria-label=Remove]")!.focus();
      await user.keyboard("{Enter}");
      await waitFor(() => expect(document.activeElement).not.toBe(document.body));
    }
    expect(rows()).toHaveLength(0);
    expect(document.activeElement).toHaveAttribute("role", "status");
    expect(document.activeElement).toHaveTextContent("0 queued");
  });

  it("PromptQueue: emptied above a composer, focus goes on to the composer", async () => {
    render(
      <div>
        <PromptQueue defaultItems={[{ id: "a", text: "Only" }]} />
        <textarea aria-label="Message" />
      </div>,
    );
    const user = userEvent.setup();
    document.querySelector<HTMLElement>("[data-slot=prompt-queue-item]")!.focus();
    await user.keyboard("{Delete}");
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Message" })).toHaveFocus());
  });

  it("RunHeader: Stop leaves with the run, the header keeps focus", async () => {
    render(<Run />);
    await press(/Stop/);
    await kept("run-header");
  });

  it("DiffView: Accept all leaves once everything is decided", async () => {
    render(<DiffView diff={PATCH} />);
    await press("Accept all");
    await kept("diff-view");
  });

  it("Terminal: Show all lines hands over to Show last lines", async () => {
    render(<Terminal command="ls" lines={["a", "b", "c", "d", "e"]} maxLines={2} status="done" />);
    await press(/Show all 5 lines/);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Show last 2 lines" })).toHaveFocus(),
    );
  });

  it("BrowserSession: Resume agent hands over to Take over", async () => {
    render(<Session />);
    await press("Resume agent");
    await waitFor(() => expect(screen.getByRole("button", { name: "Take over" })).toHaveFocus());
  });

  it("AttachmentList: Remove moves to the next file", async () => {
    render(<Files />);
    await press("Remove a.pdf");
    await kept("attachment-list");
  });

  it("ToolCall: Approve leaves with the decision, the call keeps focus", async () => {
    render(<Call />);
    await press("Approve");
    await kept("tool-call");
  });
});
