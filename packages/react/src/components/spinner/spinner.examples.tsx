import { Spinner } from "./spinner";

export function SpinnerMinimal() {
  return <Spinner />;
}

export function SpinnerFull() {
  return (
    <div className="flex items-center gap-6 text-kura-fg-muted">
      <Spinner size="sm" label="Loading small" />
      <Spinner size="md" label="Loading medium" />
      <Spinner size="lg" label="Loading large" className="text-kura-accent" />
      <span className="inline-flex items-center gap-2 text-sm">
        <Spinner size="sm" label={null} /> Fetching models…
      </span>
    </div>
  );
}
