"use client";

import { Message, MessageAvatar } from "../message";
import { Citation, type CitationSource, Sources } from "./citation";

const SOURCES: CitationSource[] = [
  {
    title: "useOptimistic – React",
    url: "https://react.dev/reference/react/useOptimistic",
    siteName: "React",
    snippet:
      "useOptimistic is a React Hook that lets you optimistically update the UI while an async action is underway.",
  },
  {
    title: "Server Actions and Mutations",
    url: "https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations",
    siteName: "Next.js",
    date: "Jun 2026",
    snippet:
      "Server Actions are asynchronous functions that are executed on the server. They can be called in Server and Client Components to handle form submissions and data mutations.",
  },
  {
    title: "Optimistic UI patterns, revisited",
    url: "https://www.example.com/blog/optimistic-ui",
    snippet:
      "The trick is not the optimism itself but the rollback: show the failure where the user is looking, and restore the previous value without a jump.",
  },
];

export function CitationMinimal() {
  return (
    <p className="max-w-md text-[15px] text-kura-fg leading-relaxed">
      React exposes a dedicated hook for optimistic updates
      <Citation index={1} source={SOURCES[0]!} />.
    </p>
  );
}

export function CitationFull() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-5">
      <p className="text-[15px] text-kura-fg leading-relaxed">
        Render the new count immediately with{" "}
        <code className="font-kura-mono text-sm">useOptimistic</code>
        <Citation index={1} source={SOURCES[0]!} openDelay={150} />, run the mutation in a Server
        Action
        <Citation index={2} source={SOURCES[1]!} display="domain" />, and restore the previous value
        quietly if it fails
        <Citation index={3} source={SOURCES[2]!} />.
      </p>
      <Sources sources={SOURCES} variant="strip" />
    </div>
  );
}

export function CitationSourcesList() {
  return (
    <Sources sources={SOURCES} variant="list" label="Further reading" className="w-full max-w-lg" />
  );
}

export function CitationInMessage() {
  return (
    <Message
      from="assistant"
      name="Kura"
      avatar={<MessageAvatar name="Kura" />}
      className="max-w-xl"
    >
      <p>
        Yes — React 19 ships <code>useOptimistic</code> for exactly this
        <Citation index={1} source={SOURCES[0]!} />. Pair it with a Server Action so the request and
        the rollback live in one place
        <Citation index={2} source={SOURCES[1]!} />.
      </p>
      <Sources sources={SOURCES.slice(0, 2)} label={null} />
    </Message>
  );
}
