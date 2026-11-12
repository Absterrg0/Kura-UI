import * as React from "react";

/**
 * Kura parts take `asChild` (render the child element instead of their own); ui-sdk parts take
 * `render`. This turns one into the other: the child becomes the rendered element and its own
 * children become the part's children, so props, handlers and refs merge onto the child.
 */
export function asChildProps<C>(
  asChild: boolean | undefined,
  children: C,
): { render?: React.ReactElement<Record<string, unknown>>; children: C } {
  if (!asChild || !React.isValidElement<Record<string, unknown>>(children)) {
    return { children };
  }
  return {
    render: React.cloneElement(children, { children: undefined }),
    children: children.props.children as C,
  };
}
