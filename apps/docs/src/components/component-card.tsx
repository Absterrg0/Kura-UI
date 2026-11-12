import Link from "next/link";
import { cn } from "@/lib/cn";
import { LiveExample } from "./landing/live-example";

export interface CardData {
  slug: string;
  title: string;
  description: string;
  category: string;
  example: string;
  /** Small components sit centred; panels are anchored top-left and cropped by the card. */
  fit: "panel" | "center";
}

export function ComponentCard({ card, className }: { card: CardData; className?: string }) {
  return (
    <article
      data-testid={`card-${card.slug}`}
      className={cn(
        "gloss group relative flex flex-col overflow-hidden rounded-[18px] bg-kura-surface",
        className,
      )}
    >
      <div
        inert
        className={cn(
          "live-gloss relative h-64 overflow-hidden border-kura-border-subtle border-b bg-stage",
          card.fit === "panel" ? "pt-6 pl-6" : "flex items-center justify-center p-6",
        )}
      >
        <div
          className={cn(
            card.fit === "panel"
              ? "fade-b h-full w-[460px] [&>*]:max-w-none"
              : "flex w-full justify-center",
          )}
        >
          <LiveExample slug={card.slug} name={card.example} lazy />
        </div>
      </div>
      <div className="flex flex-col gap-1 px-5 pt-4 pb-5">
        <h3 className="font-semibold text-[15.5px] tracking-[-0.015em]">
          <Link
            href={`/components/${card.slug}`}
            className="outline-none after:absolute after:inset-0 after:rounded-[18px] focus-visible:after:shadow-[inset_0_0_0_2px_var(--kura-ring)]"
          >
            {card.title}
          </Link>
        </h3>
        <p className="line-clamp-2 text-[14px] text-kura-fg-muted leading-relaxed">
          {card.description}
        </p>
      </div>
    </article>
  );
}
