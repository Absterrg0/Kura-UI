import Link from "next/link";
import { cn } from "@/lib/cn";
import { CardPreview } from "./card-preview";
import { LiveExample } from "./landing/live-example";
import { ScaleToFit } from "./scale-to-fit";

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
      className={cn("group relative flex min-w-0 flex-col gap-3", className)}
    >
      {/* The stage is the page itself with one hairline round it: the component is the only box. */}
      <CardPreview className="h-56 rounded-kura-xl shadow-[inset_0_0_0_1px_var(--kura-border-subtle)] transition-shadow duration-150 group-hover:shadow-[inset_0_0_0_1px_var(--kura-border-strong)] motion-reduce:transition-none">
        {card.fit === "panel" ? (
          <ScaleToFit width={400} minScale={0.8}>
            <LiveExample slug={card.slug} name={card.example} lazy />
          </ScaleToFit>
        ) : (
          <div className="flex w-full justify-center">
            <LiveExample slug={card.slug} name={card.example} lazy />
          </div>
        )}
      </CardPreview>
      <div className="flex flex-col gap-0.5 px-1">
        <h2 className="font-semibold text-[15px] tracking-[-0.01em]">
          <Link
            href={`/components/${card.slug}`}
            className="outline-none after:absolute after:inset-0 after:rounded-kura-xl focus-visible:after:outline-2 focus-visible:after:outline-kura-ring focus-visible:after:outline-offset-2"
          >
            {card.title}
          </Link>
        </h2>
        <p className="line-clamp-2 text-[14px] text-kura-fg-muted leading-relaxed">
          {card.description}
        </p>
      </div>
    </article>
  );
}
