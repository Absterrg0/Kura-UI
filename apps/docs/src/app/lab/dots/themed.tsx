"use client";

import { useSearchParams } from "next/navigation";
import { Dots } from "./dots";

/**
 * The lab scene in the theme the URL asks for (`?theme=light`). Read in the browser, not on the
 * server, so the page can be exported as a static file like every other page of the site.
 */
export function ThemedDots() {
  const theme = useSearchParams().get("theme");
  return <Dots theme={theme === "light" ? "light" : "dark"} />;
}
