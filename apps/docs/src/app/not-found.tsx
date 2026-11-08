import { Button } from "@kura-ui/react/button";
import { ShimmerText } from "@kura-ui/react/shimmer-text";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <ShimmerText className="font-kura-mono text-sm">Searching the storehouse…</ShimmerText>
      <h1 className="font-medium text-2xl tracking-tight">Nothing here</h1>
      <p className="text-kura-fg-muted text-sm">
        This page does not exist (yet). Components are added constantly.
      </p>
      <Button asChild variant="secondary">
        <Link href="/components">Browse components</Link>
      </Button>
    </div>
  );
}
