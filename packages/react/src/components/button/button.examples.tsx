import { ArrowRight, ArrowUpRight, Play, Trash2 } from "lucide-react";
import { Button } from "./button";

export function ButtonMinimal() {
  return <Button>Continue</Button>;
}

export function ButtonFull() {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="accent">
          <Play /> Run agent
        </Button>
        <Button variant="danger">
          <Trash2 /> Delete
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button size="xs" variant="secondary">
          Extra small
        </Button>
        <Button size="sm" variant="secondary">
          Small
        </Button>
        <Button size="md" variant="secondary">
          Medium
        </Button>
        <Button size="lg" variant="secondary">
          Large
        </Button>
        <Button loading>Saving</Button>
        <Button disabled variant="secondary">
          Disabled
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="brush" size="sm">
          Start a run
        </Button>
        <Button variant="brush">Start a run</Button>
        <Button variant="brush" size="lg">
          Start a run <ArrowRight />
        </Button>
      </div>
    </div>
  );
}

export function ButtonBrushHero() {
  return (
    <section
      aria-labelledby="brush-hero-title"
      className="relative flex w-full max-w-md flex-col items-start gap-5 rounded-kura-md bg-kura-surface p-8 shadow-kura-sm"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-1 rounded-[5px] border border-kura-border-subtle"
      />
      <p className="font-kura-mono text-[10px] text-kura-fg-subtle uppercase tracking-[0.16em]">
        Overnight runs
      </p>
      <h3
        id="brush-hero-title"
        className="font-kura-display text-[28px] text-kura-fg leading-[1.08] tracking-[-0.01em]"
      >
        Leave the backlog with the agent. Read the diff over coffee.
      </h3>
      <p className="text-[14px] text-kura-fg-muted leading-relaxed">
        Each run opens a pull request with its reasoning attached. Nothing merges without you.
      </p>
      <div className="flex items-center gap-3 pt-1">
        <Button variant="brush" size="lg">
          Start a run
        </Button>
        <Button variant="ghost" size="lg">
          See a sample PR
        </Button>
      </div>
    </section>
  );
}

export function ButtonAsLink() {
  return (
    <Button asChild variant="outline">
      <a href="https://github.com/Absterrg0/Kura-UI">
        View source <ArrowUpRight />
      </a>
    </Button>
  );
}
