"use client";

import { IconButton } from "@kura-ui/react/icon-button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const next = resolvedTheme === "dark" ? "light" : "dark";
  return (
    <IconButton
      label="Toggle theme"
      data-testid="theme-toggle"
      size="sm"
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
