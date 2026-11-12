import { type ChangeDetails, createChange, definePrimitive } from "@ui-sdk/core";

export type ApprovalDecision = "pending" | "approved" | "denied" | "always";

type ApprovalPromptOptions = {
  value?: ApprovalDecision;
  onValueChange?: (value: ApprovalDecision, details: ChangeDetails<"deny">) => void;
};

/**
 * The approval prompt's behavior for agents. An agent connected through `createAgent` reads the
 * prompt by its title, sees the decision as its value, and may only `deny`. Approving is a press
 * on a button marked `data-agent-confirm`, so a person always decides.
 */
export const approvalPrompt = definePrimitive({
  name: "approval-prompt",
  options: { value: "string", onValueChange: "callback" },
  controlled: ["value"],
  state: (options: ApprovalPromptOptions) => ({ value: options.value ?? "pending" }),
  sync: (options) => (options.value === undefined ? {} : { value: options.value }),
  api: (context) => {
    const change = createChange(context);
    return {
      deny: (event?: Event) => {
        if (context.store.get().value !== "pending") return false;
        return change("value", "denied", { reason: "deny", event });
      },
    };
  },
  slots: (slot) => ({
    root: slot({
      role: "region",
      attrs: (state) => ({ "data-decision": state.value }),
    }),
  }),
  agent: { actions: ["deny"] },
});
