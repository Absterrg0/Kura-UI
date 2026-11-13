import {
  Anchor,
  BookOpen,
  FileText,
  LayoutGrid,
  type LucideIcon,
  SquareTerminal,
  Workflow,
} from "lucide-react";
import { GITHUB_URL } from "./catalog";

/**
 * The site's keyboard shortcuts, in one place: the palette, the shortcut list, the nav tooltips
 * and the key handler all read from here. `keys` is a sequence ("G" then "C"), not a chord.
 */
export interface GoShortcut {
  keys: readonly string[];
  label: string;
  href: string;
  icon: LucideIcon;
  /** Opened by the browser (a file or another site), not the router. */
  external?: boolean;
}

export const GO: GoShortcut[] = [
  { keys: ["G", "C"], label: "Components", href: "/components", icon: LayoutGrid },
  { keys: ["G", "D"], label: "Docs", href: "/docs", icon: BookOpen },
  { keys: ["G", "A"], label: "Agents: MCP, CLI, llms.txt", href: "/agents", icon: SquareTerminal },
  { keys: ["G", "H"], label: "Hooks", href: "/docs/hooks", icon: Anchor },
  { keys: ["G", "W"], label: "Wiring agent events", href: "/docs/wiring-events", icon: Workflow },
  { keys: ["G", "L"], label: "llms.txt", href: "/llms.txt", icon: FileText, external: true },
];

export const GITHUB_SHORTCUT = { keys: ["G", "G"], href: GITHUB_URL } as const;
export const THEME_SHORTCUT = ["T"] as const;
export const HELP_SHORTCUT = ["?"] as const;

/** The nav's shortcut for a path, if it has one. */
export function shortcutFor(href: string): readonly string[] | undefined {
  return GO.find((g) => g.href === href)?.keys;
}
