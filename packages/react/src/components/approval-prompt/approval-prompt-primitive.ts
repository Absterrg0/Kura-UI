import { type ChangeDetails, createChange, definePrimitive, type SlotFactory } from "@ui-sdk/core";

export type ApprovalDecision = "pending" | "approved" | "denied" | "always";

type ApprovalPromptOptions = {
  value?: ApprovalDecision;
  onValueChange?: (value: ApprovalDecision, details: ChangeDetails<"deny">) => void;
};

type ApprovalPromptState = { value: ApprovalDecision };
type ApprovalPromptApi = { deny: (event?: Event) => boolean };

/**
 * The primitive's type, written out with ui-sdk's public types. Left to inference, it mentions
 * a helper ui-sdk does not export, and the package's declarations cannot be built.
 */
type ApprovalPromptPrimitive = ReturnType<
  typeof definePrimitive<
    ApprovalPromptOptions,
    ApprovalPromptState,
    ApprovalPromptApi,
    { root: ReturnType<SlotFactory<ApprovalPromptState, ApprovalPromptApi>> }
  >
>;

/**
 * The approval prompt's behavior for agents. An agent connected through `createAgent` reads the
 * prompt by its title, sees the decision as its value, and may only `deny`. Approving is a press
 * on a button marked `data-agent-confirm`, so a person always decides.
 */
export const approvalPrompt: ApprovalPromptPrimitive = definePrimitive({
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
