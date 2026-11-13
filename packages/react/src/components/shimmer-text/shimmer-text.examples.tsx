"use client";

import * as React from "react";
import { Message, MessageAvatar } from "../message";
import { ShimmerText } from "./shimmer-text";

export function ShimmerTextMinimal() {
  return <ShimmerText className="text-[15px]">Thinking…</ShimmerText>;
}

export function ShimmerTextFull() {
  const [active, setActive] = React.useState(true);
  React.useEffect(() => {
    const id = setTimeout(() => setActive(false), 3600);
    return () => clearTimeout(id);
  }, []);
  return (
    <ShimmerText as="p" active={active} duration={2.4} spread={24} className="text-[15px]">
      {active ? "Searching 24 sources…" : "Searched 24 sources"}
    </ShimmerText>
  );
}

export function ShimmerTextInMessage() {
  const [done, setDone] = React.useState(false);
  React.useEffect(() => {
    const id = setTimeout(() => setDone(true), 3200);
    return () => clearTimeout(id);
  }, []);
  return (
    <Message
      from="assistant"
      name="Kura"
      avatar={<MessageAvatar name="Kura" />}
      status={done ? "idle" : "streaming"}
      className="max-w-md"
    >
      <span role="status" className="text-[13px]">
        <ShimmerText active={!done}>
          {done ? "Read package.json" : "Reading package.json…"}
        </ShimmerText>
      </span>
      {done && (
        <p className="animate-kura-fade-in">
          You’re on React 19.2 and Next 16, so <code>useOptimistic</code> is available without a
          canary build.
        </p>
      )}
    </Message>
  );
}
