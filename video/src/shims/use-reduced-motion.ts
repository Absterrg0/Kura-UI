/**
 * Stand-in for the library's `useReducedMotion` in the film. JS-driven tweens (the context meter's
 * count-up) settle at once, because the film drives every value from the frame itself.
 */
export function useReducedMotion(): boolean {
  return true;
}
