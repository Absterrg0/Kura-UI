"use client";

import * as React from "react";

/**
 * Live elapsed milliseconds since `since` while `running`; frozen (last value) when stopped.
 * Re-renders every `interval` ms (default 1000; use 100 for sub-second timers), on the interval's
 * own boundary counted from `since`, so two clocks on one page change in the same frame instead
 * of a beat apart. SSR-safe: returns null until mounted so server and client markup agree.
 */
export function useElapsed(
  since: Date | number | null | undefined,
  running: boolean,
  interval = 1000,
): number | null {
  const [now, setNow] = React.useState<number | null>(null);
  const origin = since == null ? null : +new Date(since);
  const originRef = React.useRef(origin);
  originRef.current = origin;
  React.useEffect(() => {
    setNow(Date.now());
    if (!running) return;
    let id: ReturnType<typeof setTimeout>;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      const from = originRef.current;
      const into = from == null ? 0 : (((t - from) % interval) + interval) % interval;
      id = setTimeout(tick, interval - into);
    };
    tick();
    return () => clearTimeout(id);
  }, [running, interval]);
  if (origin == null || now == null) return null;
  return Math.max(0, now - origin);
}
