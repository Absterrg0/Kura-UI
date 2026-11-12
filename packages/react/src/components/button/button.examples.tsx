import { ArrowUpRight, GitBranch, Plus, Trash2 } from "lucide-react";
import { Button } from "./button";

export function ButtonMinimal() {
  return <Button>Continue</Button>;
}

export function ButtonFull() {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="primary">Deploy</Button>
        <Button variant="secondary">Edit prompt</Button>
        <Button variant="outline">
          <GitBranch /> Branch chat
        </Button>
        <Button variant="ghost">Skip</Button>
        <Button variant="danger">
          <Trash2 /> Delete
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button size="xs" variant="secondary">
          <Plus /> Tag
        </Button>
        <Button size="sm" variant="outline">
          Small
        </Button>
        <Button size="md" variant="outline">
          Medium
        </Button>
        <Button size="lg" variant="outline">
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
    <div className="flex items-center gap-2">
      <Button asChild>
        <a href="https://github.com/Absterrg0/Kura-UI#readme">Get started</a>
      </Button>
      <Button asChild variant="outline">
        <a href="https://github.com/Absterrg0/Kura-UI">
          View source <ArrowUpRight />
        </a>
      </Button>
    </div>
  );
}
