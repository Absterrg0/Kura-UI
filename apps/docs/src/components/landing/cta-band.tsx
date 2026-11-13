import Link from "next/link";
import { CtaLink } from "../cta-link";
import { LogoMark } from "../logo";
import { siteButton } from "../site-button";
import { EmberLight } from "./ember-light";
import { InstallChip } from "./install-chip";

/** The closing call to action: the mark with the halftone rising behind it, one headline, two keys. */
export function CtaBand({ install }: { install: string }) {
  return (
    <section
      aria-labelledby="cta-title"
      className="relative isolate overflow-hidden px-5 pt-40 pb-28 text-center md:pt-52 md:pb-36"
    >
      <div className="relative mx-auto flex max-w-[1180px] justify-center">
        <EmberLight className="-top-[150px] -z-10 max-w-[720px]" />
        <LogoMark className="size-[68px] rounded-[20px] shadow-kura-popover" />
      </div>
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 pt-12">
        <h2
          id="cta-title"
          className="font-semibold text-[40px] leading-[1.04] tracking-[-0.035em] text-balance md:text-[56px]"
        >
          Start with one component.
        </h2>
        <p className="max-w-xl text-[17px] text-kura-fg-muted leading-relaxed md:text-[18px]">
          React 19 and Tailwind CSS v4. Copy the first one in, then add the rest as your agent
          grows.
        </p>
        <div className="flex w-full flex-col items-center gap-3 pt-2 sm:w-auto sm:flex-row">
          <CtaLink href="/components" className="w-full sm:w-auto">
            Browse components
          </CtaLink>
          <Link
            href="/docs"
            className={siteButton({
              variant: "dark",
              className: "h-11 w-full rounded-[12px] px-5 text-[14.5px] sm:w-auto",
            })}
          >
            Get started
          </Link>
        </div>
        <InstallChip command={install} className="mt-1" />
      </div>
    </section>
  );
}
