import { parseArgs } from "node:util";
import { loadCatalog } from "./catalog";
import { cmdAdd, cmdDoctor, cmdInfo, cmdInit, cmdList, cmdSearch, type Output } from "./commands";

const HELP = `kura — Kura UI CLI (every command supports --json)

Usage:
  kura list [--category <id>] [--tag <tag>]   List components
  kura search <query...> [--limit n]          Natural-language search
  kura info <slug>                            Manifest: when to use, props, example
  kura add <slug...> [--overwrite] [--dry-run] [--no-install]
                                              Copy source + Kura deps, install npm deps
  kura init [--dry-run]                       Add Kura tokens CSS + cn() helper
  kura doctor                                 Check Tailwind v4 + tokens setup

Options:
  --json        Machine-readable output (for agents)
  --cwd <dir>   Project directory (default: current)
  -h, --help    Show help

Env: KURA_REGISTRY_URL=https://… to use a live registry instead of the bundled snapshot.`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    json: { type: "boolean", default: false },
    cwd: { type: "string" },
    category: { type: "string" },
    tag: { type: "string" },
    limit: { type: "string" },
    overwrite: { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
    "no-install": { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
    version: { type: "boolean", short: "v", default: false },
  },
});

// Exit quietly when piped into `head` and friends.
process.stdout.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EPIPE") process.exit(0);
  throw err;
});

const out: Output = { json: !!values.json, log: (line = "") => process.stdout.write(`${line}\n`) };
const [command, ...args] = positionals;
const cwd = values.cwd ?? process.cwd();

try {
  const catalog = await loadCatalog();
  if (values.version) out.log(catalog.version);
  else if (values.help || !command) out.log(HELP);
  else if (command === "list" || command === "ls")
    cmdList(catalog, out, { category: values.category, tag: values.tag });
  else if (command === "search")
    cmdSearch(catalog, out, args.join(" "), values.limit ? Number(values.limit) : 8);
  else if (command === "info") cmdInfo(catalog, out, args[0] ?? "");
  else if (command === "add")
    cmdAdd(catalog, out, args, {
      cwd,
      overwrite: !!values.overwrite,
      dryRun: !!values["dry-run"],
      install: !values["no-install"],
    });
  else if (command === "init") cmdInit(catalog, out, { cwd, dryRun: !!values["dry-run"] });
  else if (command === "doctor") {
    const checks = cmdDoctor(out, { cwd });
    if (checks.some((c) => c.status === "fail")) process.exitCode = 1;
  } else throw new Error(`Unknown command "${command}".\n\n${HELP}`);
} catch (err) {
  const message = (err as Error).message;
  if (out.json) out.log(JSON.stringify({ error: message }));
  else process.stderr.write(`kura: ${message}\n`);
  process.exitCode = 1;
}
