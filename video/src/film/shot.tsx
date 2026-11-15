import * as React from "react";
import { useCurrentFrame } from "remotion";

/**
 * Each shot is written in film frames. The film places it in a Sequence and tells it which film
 * frame its first frame is (its origin), so a shot can be reused at another point of the edit, or
 * entered part-way through its own timeline, without touching its code.
 */
export const ShotOrigin = React.createContext(0);

/** The film frame this shot's timeline is at. */
export function useF() {
  return useCurrentFrame() + React.useContext(ShotOrigin);
}
