import { filmNow } from "../lib/clock";

/**
 * Stand-in for the library's `useElapsed` in the film: the same contract, read from the frame
 * instead of a timer, so a clock on screen shows the same value in every render of a frame.
 */
export function useElapsed(
  since: Date | number | null | undefined,
  _running: boolean,
  _interval = 1000,
): number | null {
  if (since == null) return null;
  return Math.max(0, filmNow() - +new Date(since));
}
