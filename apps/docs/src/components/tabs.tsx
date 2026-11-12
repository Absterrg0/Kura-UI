"use client";

import { Tabs as TabsPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/cn";

export function Tabs(props: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root {...props} />;
}

export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex items-center gap-0.5 rounded-[10px] bg-kura-hover p-0.5 shadow-[inset_0_0_0_1px_var(--kura-border-subtle)]",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "h-7 cursor-pointer rounded-lg px-3 font-medium text-[13px] text-kura-fg-muted outline-none transition-colors duration-(--kura-duration-fast)",
        "hover:text-kura-fg focus-visible:ring-2 focus-visible:ring-kura-ring data-[state=active]:bg-kura-surface-raised data-[state=active]:text-kura-fg data-[state=active]:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_var(--kura-border),0_1px_2px_rgb(0_0_0/0.12)]",
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
