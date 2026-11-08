import { Button } from "@kura-ui/react/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="font-kura-mono text-[13px] text-kura-fg-subtle">404</p>
      <h1 className="font-semibold text-[28px] tracking-[-0.035em]">Page not found</h1>
      <p className="text-[15px] text-kura-fg-muted">
        This page doesn&apos;t exist, or hasn&apos;t been built yet.
      </p>
      <Button asChild variant="secondary" className="mt-3">
        <Link href="/components">Browse components</Link>
      </Button>
    </div>
  );
}
