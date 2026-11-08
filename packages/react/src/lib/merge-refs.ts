import type * as React from "react";

/** Combine several refs (callback or object) into one callback ref. React 19 cleanup-aware. */
export function mergeRefs<T>(
  ...refs: Array<React.Ref<T> | undefined | null>
): React.RefCallback<T> {
  return (value: T | null) => {
    const cleanups: Array<() => void> = [];
    for (const ref of refs) {
      if (typeof ref === "function") {
        const cleanup = ref(value);
        if (typeof cleanup === "function") cleanups.push(cleanup);
      } else if (ref) {
        (ref as React.RefObject<T | null>).current = value;
      }
    }
    if (cleanups.length === 0) return;
    return () => {
      for (const c of cleanups) c();
    };
  };
}
