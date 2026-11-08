import type * as React from "react";
import { cn } from "@/lib/cn";
import type { Kanji } from "@/lib/kanji";
import { Seal } from "./seal";

/** A section opener: Redaction headline, a vermilion brush stroke, an italic lead and a seal. */
export function SectionHeading({
  glyph,
  title,
  lead,
  className,
  as: Tag = "h2",
}: {
  glyph?: Kanji;
  title: React.ReactNode;
  lead?: React.ReactNode;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <header className={cn("relative flex flex-col pr-20", className)}>
      <Tag
        className={cn(
          "font-kura-display tracking-[-0.02em] text-balance",
          Tag === "h1" ? "text-[clamp(2.6rem,5vw,4.2rem)]" : "text-[clamp(2.2rem,4.2vw,3.5rem)]",
          // after the size: tailwind-merge drops a leading-* that precedes a text-* size
          "leading-[1.02]",
        )}
      >
        {title}
      </Tag>
      <span aria-hidden className="brush-rule mt-5 w-44 text-kura-shu" />
      {lead && (
        <p className="max-w-[36rem] pt-6 font-kura-display text-[19px] text-kura-fg-muted italic leading-[1.5] text-pretty">
          {lead}
        </p>
      )}
      {glyph && <Seal glyph={glyph} tilt={4} className="absolute top-1 right-0 size-14" />}
    </header>
  );
}
