import { ShimmerText } from "@kura-ui/react/shimmer-text";
import { Seal } from "@/components/seal";
import { SwashLink } from "@/components/swash-link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[64vh] max-w-lg flex-col items-center justify-center gap-6 px-5 text-center">
      <Seal glyph="蔵" tilt={-6} className="size-16" />
      <ShimmerText className="font-kura-mono text-[11px] uppercase tracking-[0.16em]">
        Searching the storehouse…
      </ShimmerText>
      <h1 className="font-kura-display text-[44px] leading-none tracking-[-0.02em]">
        Not on any shelf.
      </h1>
      <p className="font-kura-display text-[19px] text-kura-fg-muted italic">
        This page doesn&apos;t exist, or hasn&apos;t been made yet.
      </p>
      <SwashLink href="/components" size="sm">
        Back to the store
      </SwashLink>
    </div>
  );
}
