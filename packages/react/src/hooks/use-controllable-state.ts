import { useCallback, useRef, useState } from "react";

export interface UseControllableStateOptions<T> {
  /** Controlled value. When defined, the hook is controlled and never stores its own state. */
  value?: T | undefined;
  /** Initial value when uncontrolled. */
  defaultValue: T;
  /** Called on every change request, controlled or not. Not called when the value is unchanged. */
  onChange?: ((value: T) => void) | undefined;
}

export type SetStateAction<T> = T | ((previous: T) => T);

/**
 * One state API for components that support both controlled (`value` + `onChange`) and
 * uncontrolled (`defaultValue`) usage.
 *
 *   const [open, setOpen] = useControllableState({ value: props.open, defaultValue: false, onChange: props.onOpenChange });
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: UseControllableStateOptions<T>): [T, (next: SetStateAction<T>) => void] {
  const [uncontrolled, setUncontrolled] = useState<T>(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? (value as T) : uncontrolled;

  const currentRef = useRef(current);
  currentRef.current = current;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const setValue = useCallback(
    (next: SetStateAction<T>) => {
      const resolved =
        typeof next === "function" ? (next as (previous: T) => T)(currentRef.current) : next;
      if (Object.is(resolved, currentRef.current)) return;
      currentRef.current = resolved;
      if (!isControlled) setUncontrolled(resolved);
      onChangeRef.current?.(resolved);
    },
    [isControlled],
  );

  return [current, setValue];
}
