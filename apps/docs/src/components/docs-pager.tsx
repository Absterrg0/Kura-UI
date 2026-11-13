"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { DOCS_PAGES } from "@/lib/docs-pages";
import { DotArrow } from "./dot-arrow";

/** Previous and next at the foot of a docs page, in sidebar order. */
export function DocsPager() {
  const pathname = usePathname();
  const i = DOCS_PAGES.findIndex((p) => p.href === pathname);
  if (i < 0) return null;
  const prev = DOCS_PAGES[i - 1];
  const next = DOCS_PAGES[i + 1];
  const card =
    "sheet sheet-link group flex flex-1 flex-col gap-1 rounded-kura-xl px-5 py-4 outline-hidden focus-visible:shadow-kura-focus";
  return (
    <nav aria-label="More docs" className="mt-20 flex max-w-[46rem] flex-col gap-3 sm:flex-row">
      {prev ? (
        <Link href={prev.href} className={card}>
          <span className="flex items-center gap-2 text-[12.5px] text-kura-fg-subtle">
            <DotArrow width={13} className="rotate-180" />
            Previous
          </span>
          <span className="font-medium text-[15px]">{prev.label}</span>
        </Link>
      ) : (
        <span className="hidden flex-1 sm:block" />
      )}
      {next && (
        <Link href={next.href} className={cn(card, "items-end text-right")}>
          <span className="flex items-center gap-2 text-[12.5px] text-kura-fg-subtle">
            Next
            <DotArrow width={13} />
          </span>
          <span className="font-medium text-[15px]">{next.label}</span>
        </Link>
      )}
    </nav>
  );
}
