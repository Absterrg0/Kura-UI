import Link from "next/link";
import { siteButton } from "@/components/site-button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[64vh] max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
      <p className="font-kura-mono text-[13px] text-kura-fg-subtle">404</p>
      <h1 className="font-semibold text-[40px] leading-[1.05] tracking-[-0.03em]">
        Page not found
      </h1>
      <p className="text-[16px] text-kura-fg-muted">
        This page doesn&apos;t exist, or hasn&apos;t been built yet.
      </p>
      <Link href="/components" className={siteButton({ className: "mt-4" })}>
        Browse components
      </Link>
    </div>
  );
}
