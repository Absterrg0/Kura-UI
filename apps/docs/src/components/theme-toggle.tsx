"use client";

import { IconButton } from "@kura-ui/react/icon-button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/cn";

export function ThemeToggle({
  size = "sm",
  className,
}: {
  size?: "sm" | "md";
  className?: string;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const next = resolvedTheme === "dark" ? "light" : "dark";
  return (
    <IconButton
      label="Toggle theme"
      data-testid="theme-toggle"
      size={size}
      className={cn("rounded-lg text-kura-fg-muted", size === "md" && "size-11", className)}
      onClick={() => setTheme(next)}
      icon={
        <>
          <Sun className="hidden dark:block" />
          <Moon className="dark:hidden" />
        </>
      }
    />
  );
}
