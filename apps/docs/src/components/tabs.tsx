"use client";

import { Tabs as TabsPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/cn";

export function Tabs(props: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root {...props} />;
}

export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List className={cn("inline-flex items-center gap-1", className)} {...props} />
  );
}

/** Mono labels; the active one is underscored with a short stroke of ink. */
export function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "relative h-8 cursor-pointer rounded-[5px] px-2.5 font-kura-mono text-[11px] text-kura-fg-subtle uppercase tracking-[0.12em] outline-none transition-colors duration-(--kura-duration-fast)",
        "hover:text-kura-fg focus-visible:shadow-kura-focus data-[state=active]:text-kura-fg",
        "after:absolute after:right-2.5 after:bottom-1 after:left-2.5 after:h-[2px] after:rounded-full after:bg-kura-fg after:opacity-0 after:transition-opacity data-[state=active]:after:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn("outline-none", className)} {...props} />;
}
