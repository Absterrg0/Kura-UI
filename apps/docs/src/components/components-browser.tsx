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
  // A search looks across every category: typing "diff" on the Voice tab still finds Diff view.
  const shown = cards.filter((c) =>
    q
      ? `${c.title} ${c.slug} ${c.description}`.toLowerCase().includes(q)
      : category === "all" || c.category === category,
  );
  const tabs = [{ id: "all", title: "All" }, ...categories];
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <fieldset className="flex min-w-0 flex-wrap gap-1">
          <legend className="sr-only">Category</legend>
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={!q && category === t.id}
              onClick={() => {
                setCategory(t.id);
                setQuery("");
              }}
              className={cn(
                "h-8 shrink-0 cursor-pointer rounded-[9px] px-3 text-[13.5px] outline-hidden transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-kura-ring",
                !q && category === t.id
                  ? "bg-kura-raised font-medium text-kura-fg shadow-kura-raised"
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
            className="well h-9 w-full appearance-none rounded-[9px] pr-3 pl-8.5 text-[13.5px] text-kura-fg outline-hidden placeholder:text-kura-fg-subtle [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-kura-ring"
          />
        </label>
      </div>
      <p aria-live="polite" className="sr-only">
        {shown.length} components
      </p>
      {shown.length ? (
        <div className="grid grid-cols-1 gap-x-4 gap-y-9 sm:grid-cols-2 xl:grid-cols-3">
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
