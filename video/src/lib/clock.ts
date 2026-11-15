/**
 * One clock for the whole film. The root composition sets it from the frame on every render,
 * before its children render, so any library code that asks for the time gets the frame's time.
 */
const EPOCH = Date.UTC(2026, 10, 18, 9, 0, 0);

declare global {
  var __KURA_FILM_MS__: number;
}
globalThis.__KURA_FILM_MS__ = 0;

export function setFilmTime(ms: number) {
  globalThis.__KURA_FILM_MS__ = ms;
}

/** The film's wall clock: a fixed epoch plus the frame's time. */
export function filmNow() {
  return EPOCH + globalThis.__KURA_FILM_MS__;
}

let patched = false;
/** Library code that reads Date.now() sees the film's clock, so every render is the same. */
export function patchClock() {
  if (patched) return;
  patched = true;
  Date.now = filmNow;
}
