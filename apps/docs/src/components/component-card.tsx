import Link from "next/link";
import { cn } from "@/lib/cn";
import { CardPreview } from "./card-preview";
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
      className={cn("group relative flex h-full min-w-0 flex-col gap-3", className)}
    >
      {/* The stage is the page itself with one hairline round it: the component is the only box. */}
      <CardPreview className="min-h-56 rounded-kura-xl shadow-[inset_0_0_0_1px_var(--kura-border-subtle)] transition-shadow duration-150 group-hover:shadow-[inset_0_0_0_1px_var(--kura-border-strong)] motion-reduce:transition-none">
        {/* Components are responsive, so they are laid out at the card's real width: nothing is
            scaled, and nothing runs off the side. */}
        <div
          className={
            card.fit === "panel"
              ? "w-full [&>*]:max-w-full"
              : "flex w-full justify-center [&>*]:max-w-full"
          }
        >
          <LiveExample slug={card.slug} name={card.example} lazy />
        </div>
      </CardPreview>
      <div className="flex flex-col gap-0.5 px-1">
        <h2 className="font-semibold text-[15px] tracking-[-0.01em]">
          <Link
            href={`/components/${card.slug}`}
            className="outline-hidden after:absolute after:inset-0 after:rounded-kura-xl focus-visible:after:outline-2 focus-visible:after:outline-solid focus-visible:after:outline-kura-ring focus-visible:after:outline-offset-2"
          >
            {card.title}
          </Link>
        </h2>
        <p className="line-clamp-2 min-h-[2lh] text-[14px] text-kura-fg-muted leading-relaxed">
          {card.description}
        </p>
      </div>
    </article>
  );
}
