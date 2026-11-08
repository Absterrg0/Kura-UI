# @kura-ui/cli

```bash
npx @kura-ui/cli <command> [--json]
```

| Command                                                       |                                                                                                                       |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `kura list [--category <id>] [--tag <tag>]`                   | List components                                                                                                       |
| `kura search <query...> [--limit n]`                          | Natural-language search (“mic button with waveform”)                                                                  |
| `kura info <slug>`                                            | Manifest: when to use / not, props, install, example                                                                  |
| `kura add <slug...> [--overwrite] [--dry-run] [--no-install]` | Copy source + Kura dependencies into `components/kura/`, `hooks/kura/`, `lib/kura/`; install npm deps; add tokens CSS |
| `kura init [--dry-run]`                                       | Add `styles/kura.css` (imported into your global CSS) and a `cn()` helper                                             |
| `kura doctor`                                                 | Check React 19, Tailwind v4, global CSS, tokens and `cn`                                                              |

Every command accepts `--json` (stable, machine-readable output for agents) and `--cwd <dir>`.
Imports use your tsconfig alias (`@/` or `~/`), the same layout as `npx shadcn add <url>/r/<slug>.json`.
Set `KURA_REGISTRY_URL` to use a live registry instead of the bundled snapshot.
