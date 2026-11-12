import type { Metadata } from "next";
import { Dots } from "./dots";

export const metadata: Metadata = { title: "Lab: dots", robots: { index: false } };

export default async function DotsPage({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string }>;
}) {
  const { theme } = await searchParams;
  return <Dots theme={theme === "light" ? "light" : "dark"} />;
}
