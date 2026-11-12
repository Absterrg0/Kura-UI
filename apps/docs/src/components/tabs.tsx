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
      className={cn("well inline-flex items-center gap-0.5 rounded-[9px] p-0.5", className)}
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
        "h-7 cursor-pointer rounded-[7px] px-3 font-medium text-[13px] text-kura-fg-muted outline-hidden transition-colors duration-(--kura-duration-fast)",
        "hover:text-kura-fg focus-visible:ring-2 focus-visible:ring-kura-ring data-[state=active]:bg-kura-raised data-[state=active]:text-kura-fg data-[state=active]:shadow-kura-raised",
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
  return (
    <TabsPrimitive.Content
      className={cn(
        "outline-hidden focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-kura-ring",
        className,
      )}
      {...props}
    />
  );
}
