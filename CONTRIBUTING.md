# Contributing to Kura UI

Thanks for helping. Humans and agents follow the same rules — they are written down in
[AGENTS.md](./AGENTS.md) (conventions, the add-a-component checklist, the quality bar) and
[DESIGN.md](./DESIGN.md) (the Kura Signal design language).

## Setup

```bash
nvm use            # Node 24 (.nvmrc)
corepack enable    # pnpm from packageManager
pnpm install
pnpm dev           # docs at http://localhost:3000, regenerates on component changes
```

## Workflow

1. Branch from `main`.
2. New component: `pnpm new <slug> --category <id>` and follow the checklist in AGENTS.md.
   A component PR should touch **only** `packages/react/src/components/<slug>/` (+ a changeset).
3. `pnpm check` must pass (generate, validate:meta, Biome, typecheck, tests).
4. `pnpm build && pnpm test:visual` for anything visual; attach screenshots from `apps/docs/.screenshots/`.
5. Add a changeset: `pnpm changeset` (patch for fixes, minor for new components while < 1.0).
6. Open a PR. CI runs the same checks plus the visual smoke tests.

## Generated files

Never edit or commit: `registry.json`, `apps/docs/public/{r,registry,components,llms.txt,llms-full.txt}`,
`apps/docs/src/generated/`, `packages/{mcp,cli}/data/`. They are rebuilt by `pnpm generate`.

## Releasing

Maintainers: merge the "Version Packages" PR created by changesets, or run `pnpm version-packages`
then `pnpm release` (builds everything, then `changeset publish`).

## Code of conduct

Be kind, be specific, assume good intent.
