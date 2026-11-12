import Link from "next/link";
import { LogoMark } from "../logo";
import { siteButton } from "../site-button";
import { EmberLight } from "./ember-light";
import { InstallChip } from "./install-chip";

/** The closing call to action: the mark lit from behind, one headline, two buttons. */
export function CtaBand({ install }: { install: string }) {
  return (
    <section
      aria-labelledby="cta-title"
      className="relative isolate px-5 pt-36 pb-28 text-center md:pt-44 md:pb-36"
    >
      <div className="relative mx-auto flex h-[120px] max-w-[1200px] items-center justify-center">
        <EmberLight
          variant="band"
          className="top-1/2 -z-10 -translate-y-1/2 max-md:scale-x-[0.6]"
        />
        <LogoMark className="size-[76px] rounded-[22px] shadow-[0_0_0_1px_rgb(255_255_255/0.12),0_20px_60px_-12px_color-mix(in_oklch,var(--ember-deep)_70%,transparent)]" />
      </div>
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 pt-12">
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
    </section>
  );
}
