import { definePrimitive, type SlotFactory } from "@ui-sdk/core";

/** One thing an agent can name in an action, like a queued prompt or a diff hunk. */
export interface AgentItem {
  /** Stable id passed to the action. */
  value: string;
  /** What a person would call it; agents can name the item by this text. */
  label: string;
}

export interface AgentSurfaceOptions {
  /** A short summary an agent reads as the component's value, e.g. "5 of 8 done". */
  value?: string;
  /** The items the actions take. Up to 10 are listed with the component in the snapshot. */
  items?: AgentItem[];
  /** Runs when an agent calls one of the declared actions. Calls only ever come from an agent. */
  onAction?: (action: string, args: unknown[]) => unknown;
}

type SurfaceState = { value: string; items: AgentItem[] };
type SurfaceApi<Action extends string> = Record<Action, (...args: unknown[]) => unknown>;

/**
 * What `agentSurface` returns, written out with ui-sdk's public types. Left to inference, the
 * type mentions a helper ui-sdk does not export, and the package's declarations cannot be built.
 */
export type AgentSurfacePrimitive<Action extends string> = ReturnType<
  typeof definePrimitive<
    AgentSurfaceOptions,
    SurfaceState,
    SurfaceApi<Action>,
    { root: ReturnType<SlotFactory<SurfaceState, SurfaceApi<Action>>> }
  >
>;

/**
 * A ui-sdk primitive that makes a Kura component readable and operable by an agent connected
 * through `createAgent` (from `@ui-sdk/react/agent`). The component stays in charge of its own
 * rendering and state: the surface reports a value and items, and routes each declared action to
 * `onAction`. Name the root (aria-label or aria-labelledby) so the agent can find it.
 *
 *   const queue = agentSurface("prompt-queue", ["sendNow", "remove"]);
 *   const { Root } = createParts(queue, { root: "div" });
 */
export function agentSurface<const Action extends string>(
  name: string,
  actions: readonly Action[],
  extra: { closed?: boolean } = {},
): AgentSurfacePrimitive<Action> {
  return definePrimitive({
    name,
    options: { value: "string", items: "value", onAction: "value" },
    state: (options: AgentSurfaceOptions) => ({
      value: options.value ?? "",
      items: options.items ?? [],
    }),
    sync: (options) => ({
      ...(options.value !== undefined ? { value: options.value } : {}),
      ...(options.items !== undefined ? { items: options.items } : {}),
    }),
    api: (context) =>
      Object.fromEntries(
        actions.map((action) => [
          action,
          (...args: unknown[]) => context.options().onAction?.(action, args),
        ]),
      ) as SurfaceApi<Action>,
    slots: (slot) => ({ root: slot({}) }),
    agent: { actions: [...actions], ...(extra.closed ? { closed: true } : {}) },
  });
}
