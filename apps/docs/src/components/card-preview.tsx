import type * as React from "react";
import { cn } from "@/lib/cn";

/**
 * The live preview area of a component card: the component, whole and centred. The stage grows
 * to fit it (and stretches to the tallest card in its row), so a sheet is never cropped.
 */
export function CardPreview({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div inert className={cn("relative flex flex-1 flex-col justify-center px-6 py-6", className)}>
      <div className="w-full">{children}</div>
    </div>
  );
}
