"use client";

import * as React from "react";

/**
 * Live elapsed milliseconds since `since` while `running`; frozen (last value) when stopped.
 * Re-renders every `interval` ms (default 1000; use 100 for sub-second timers). SSR-safe: returns
 * null until mounted so server and client markup agree.
 */
export function useElapsed(
  since: Date | number | null | undefined,
  running: boolean,
  interval = 1000,
): number | null {
  const [now, setNow] = React.useState<number | null>(null);
  React.useEffect(() => {
    setNow(Date.now());
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [running, interval]);
  if (since == null || now == null) return null;
  return Math.max(0, now - +new Date(since));
}
