"use client";

import { useReducedMotion } from "@kura-ui/react/hooks";
import { ArrowUp } from "lucide-react";
import { usePathname } from "next/navigation";
import * as React from "react";
import { GITHUB_URL } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { GithubIcon } from "./icons";

interface Entry {
  id: string;
  title: string;
}

/**
 * The right rail of a docs page: its sections on a dotted spine, read like a run. Sections you
 * have passed are solid, the one you are in is lit and larger, the rest wait unlit. Below it,
 * the way back to the top and the page's source.
 */
export function OnThisPage() {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const [entries, setEntries] = React.useState<Entry[]>([]);
  const [active, setActive] = React.useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-read the page on navigation
  React.useEffect(() => {
    const root = document.getElementById("docs-content");
    if (!root) return;
    const sections = [...root.querySelectorAll<HTMLElement>("section[id]")].filter((s) =>
      s.querySelector(":scope > h2"),
    );
    setEntries(
      sections.map((s) => ({
        id: s.id,
        title: s.querySelector(":scope > h2")?.textContent?.trim() ?? s.id,
      })),
    );
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = 0;
      sections.forEach((s, i) => {
        if (s.getBoundingClientRect().top < 160) current = i;
      });
      // At the very bottom, the last section is the one being read even if it is short.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8) {
        current = sections.length - 1;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  const jump = (e: React.MouseEvent, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  };

  const source = `${GITHUB_URL}/blob/main/apps/docs/src/app${pathname === "/" ? "" : pathname}/page.tsx`;
  const link =
    "flex items-center gap-2 rounded-md py-1 text-[13px] text-kura-fg-subtle outline-hidden transition-colors hover:text-kura-fg focus-visible:shadow-kura-focus [&_svg]:size-3.5";

  return (
    <aside
      aria-label="On this page"
      className="sticky top-[76px] hidden h-fit w-48 shrink-0 pt-12 md:pt-16 xl:block"
    >
      {entries.length > 1 && (
        <>
          <p className="pb-3 font-medium text-[12.5px] text-kura-fg-subtle">On this page</p>
          <ol className="relative flex flex-col">
            {/* The spine, threaded through the dots. */}
            <span aria-hidden className="kura-leader absolute top-3 bottom-3 left-[4px] w-[5px]" />
            {entries.map((entry, i) => {
              const state = i < active ? "read" : i === active ? "current" : "ahead";
              return (
                <li key={entry.id}>
                  <a
                    href={`#${entry.id}`}
                    onClick={(e) => jump(e, entry.id)}
                    aria-current={state === "current" ? "location" : undefined}
                    className={cn(
                      "group relative flex items-start gap-3 rounded-md py-[5px] pr-1 text-[13px] leading-[18px] outline-hidden transition-colors duration-200 focus-visible:shadow-kura-focus",
                      state === "current"
                        ? "text-kura-fg"
                        : "text-kura-fg-subtle hover:text-kura-fg-muted",
                    )}
                  >
                    <span
                      aria-hidden
                      className="relative z-10 mt-[5px] flex size-[13px] shrink-0 items-center justify-center bg-kura-canvas"
                    >
                      <span
                        className={cn(
                          "rounded-full transition-[width,height,background-color] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none",
                          state === "current"
                            ? "size-[7px] bg-kura-fg"
                            : state === "read"
                              ? "size-[5px] bg-kura-fg-subtle"
                              : "size-[5px] bg-kura-faint",
                        )}
                      />
                    </span>
                    <span className="min-w-0">{entry.title}</span>
                  </a>
                </li>
              );
            })}
          </ol>
          <span aria-hidden className="kura-leader my-5 block h-[5px]" />
        </>
      )}
      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" })}
          className={cn(link, "cursor-pointer text-left")}
        >
          <ArrowUp />
          Back to top
        </button>
        <a href={source} className={link}>
          <GithubIcon />
          View this page's source
        </a>
      </div>
    </aside>
  );
}
