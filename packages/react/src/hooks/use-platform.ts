import { useSyncExternalStore } from "react";
import { isApplePlatform } from "../lib/keys";

const noopSubscribe = () => () => {};

/**
 * `true` on macOS/iOS. Hydration-safe: renders as non-Apple on the server and on the first client
 * pass, then updates — so "⌘" vs "Ctrl" never causes a hydration mismatch.
 */
export function useIsApplePlatform(): boolean {
  return useSyncExternalStore(noopSubscribe, isApplePlatform, () => false);
}
