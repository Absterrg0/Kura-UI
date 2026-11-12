import Link from "next/link";
import { siteButton } from "../site-button";
import { EmberLight } from "./ember-light";
import { InstallChip } from "./install-chip";

export function CtaBand({ install }: { install: string }) {
  return (
    <section
      aria-labelledby="cta-title"
      className="relative isolate overflow-hidden px-5 pt-40 text-center md:pt-48"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
        <h2
          id="cta-title"
          className="font-semibold text-[40px] leading-[1.04] tracking-[-0.035em] text-balance md:text-[56px]"
        >
          Give your agent a proper interface.
        </h2>
        <p className="max-w-xl text-[17px] text-kura-fg-muted leading-relaxed md:text-[18px]">
          React 19 and Tailwind CSS v4. Start with one component, then add the rest as your agent
          grows.
        </p>
        <div className="flex w-full flex-col items-center gap-3 pt-2 sm:w-auto sm:flex-row">
          <Link href="/components" className={siteButton({ className: "w-full sm:w-auto" })}>
            Browse components
          </Link>
          <Link
            href="/docs"
            className={siteButton({ variant: "dark", className: "w-full sm:w-auto" })}
          >
            Get started
          </Link>
        </div>
        <InstallChip command={install} className="mt-1" />
      </div>
      {/* The horizon: light bursting outward from under the call to action. */}
      <div className="relative -z-10 mt-6 h-[150px] md:h-[170px]">
        <EmberLight variant="band" className="-top-[96px] max-md:origin-top max-md:scale-[0.6]" />
      </div>
    </section>
  );
}
