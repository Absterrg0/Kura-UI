"use client";

import { Search } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/cn";
import { type CardData, ComponentCard } from "./component-card";

/** The components index: category tabs and a filter in one row over a grid of live cards. */
export function ComponentsBrowser({
  cards,
  categories,
}: {
  cards: CardData[];
  categories: { id: string; title: string }[];
}) {
  const [category, setCategory] = React.useState("all");
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const shown = cards.filter(
    (c) =>
      (category === "all" || c.category === category) &&
      (!q || `${c.title} ${c.slug} ${c.description}`.toLowerCase().includes(q)),
  );
  const tabs = [{ id: "all", title: "All" }, ...categories];
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <fieldset className="-mx-5 flex min-w-0 gap-1 overflow-x-auto px-5 [scrollbar-width:none] md:mx-0 md:px-0">
          <legend className="sr-only">Category</legend>
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={category === t.id}
              onClick={() => setCategory(t.id)}
              className={cn(
                "h-8 shrink-0 cursor-pointer rounded-lg px-3 text-[14px] outline-none transition-colors duration-150 focus-visible:shadow-kura-focus",
                category === t.id
                  ? "bg-kura-hover font-medium text-kura-fg shadow-[inset_0_0_0_1px_var(--kura-border)]"
                  : "text-kura-fg-muted hover:text-kura-fg",
              )}
            >
              {t.title}
            </button>
          ))}
        </fieldset>
        <label className="relative flex h-9 items-center md:w-64">
          <span className="sr-only">Filter components</span>
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 size-3.5 text-kura-fg-subtle"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter"
            className="h-9 w-full rounded-lg bg-kura-hover pr-3 pl-8.5 text-[14px] text-kura-fg shadow-[inset_0_0_0_1px_var(--kura-border-subtle)] outline-none placeholder:text-kura-fg-subtle focus-visible:shadow-kura-focus"
          />
        </label>
      </div>
      <p aria-live="polite" className="sr-only">
        {shown.length} components
      </p>
      {shown.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((c) => (
            <ComponentCard key={c.slug} card={c} />
          ))}
        </div>
      ) : (
        <p className="py-20 text-center text-[15px] text-kura-fg-muted">
          No components match “{query}”.
        </p>
      )}
    </div>
  );
}
