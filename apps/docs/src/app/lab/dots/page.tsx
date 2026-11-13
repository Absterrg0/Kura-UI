import type { Metadata } from "next";
import { Suspense } from "react";
import { Dots } from "./dots";
import { ThemedDots } from "./themed";

export const metadata: Metadata = { title: "Lab: dots", robots: { index: false } };

// The static file holds the dark scene; `?theme=light` is applied once the page is in a browser.
export default function DotsPage() {
  return (
    <Suspense fallback={<Dots />}>
      <ThemedDots />
    </Suspense>
  );
}
