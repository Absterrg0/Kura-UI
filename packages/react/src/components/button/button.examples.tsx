import { ArrowUpRight, Sparkles, Trash2 } from "lucide-react";
import { Button } from "./button";

export function ButtonMinimal() {
  return <Button>Continue</Button>;
}

export function ButtonFull() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="accent">
          <Sparkles /> Run agent
        </Button>
        <Button variant="danger">
          <Trash2 /> Delete
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button size="xs" variant="secondary">
          XS
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
    </div>
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
