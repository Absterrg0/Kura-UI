/**
 * Unified-diff parsing and line pairing for DiffView. Pure functions, no React, safe anywhere.
 *
 * The parser is count-driven (it trusts the `@@ -a,b +c,d @@` header to know where a hunk
 * ends, so a removed line such as `-- comment` or `--- a/x` inside a hunk is never mistaken for a
 * file header) but forgiving: agents often emit hunks whose counts are wrong, so a hunk also ends
 * at anything that cannot be a hunk line, and a short hunk simply stops early.
 */

export type DiffFileStatus = "added" | "modified" | "deleted" | "renamed";
export type DiffLineKind = "context" | "add" | "remove";

export interface DiffLine {
  kind: DiffLineKind;
  /** The line's text without its `+` / `-` / space prefix. */
  content: string;
  /** Line number in the old file (absent for additions). */
  oldNumber?: number;
  /** Line number in the new file (absent for removals). */
  newNumber?: number;
  /** The diff said `\ No newline at end of file` after this line. */
  noNewline?: boolean;
}

export interface DiffHunk {
  /** Stable id for review state. Default `${path}#${index}`. */
  id?: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  /** Section heading git prints after the second `@@` (usually the enclosing function). */
  section?: string;
  lines: DiffLine[];
}

export interface DiffFile {
  /** Path after the change (the old path for deletions). */
  path: string;
  /** Path before a rename or copy. */
  oldPath?: string;
  status: DiffFileStatus;
  /** Highlighting language. Default: from the file extension. */
  language?: string;
  /** Binary change: no hunks are shown. */
  binary?: boolean;
  hunks: DiffHunk[];
}

/** Structured input: like DiffHunk, but positions are optional and lines may be raw diff strings (`"+added"`, `"-removed"`, `" context"`). */
export interface DiffHunkInput {
  id?: string;
  oldStart?: number;
  newStart?: number;
  section?: string;
  lines: ReadonlyArray<string | DiffLine>;
}

export interface DiffFileInput {
  path: string;
  oldPath?: string;
  status?: DiffFileStatus;
  language?: string;
  binary?: boolean;
  hunks: readonly DiffHunkInput[];
}

const HUNK_RE = /^@@+ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@+ ?(.*)$/;

/** Undo git's C-style quoting: `"a/caf\303\251 menu.ts"` → `a/café menu.ts`. */
function unquote(path: string): string {
  if (!(path.length >= 2 && path.startsWith('"') && path.endsWith('"'))) return path;
  const body = path.slice(1, -1);
  const bytes: number[] = [];
  const escapes: Record<string, number> = { n: 10, t: 9, r: 13, '"': 34, "\\": 92, a: 7, b: 8 };
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]!;
    if (ch !== "\\") {
      for (const b of new TextEncoder().encode(ch)) bytes.push(b);
      continue;
    }
    const next = body[i + 1] ?? "";
    const octal = /^[0-7]{3}/.exec(body.slice(i + 1));
    if (octal) {
      bytes.push(Number.parseInt(octal[0], 8));
      i += 3;
    } else if (next in escapes) {
      bytes.push(escapes[next]!);
      i += 1;
    } else {
      bytes.push(92);
    }
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

/** Path from a `---` / `+++` line: drops the trailing tab + timestamp and quoting. */
function headerPath(raw: string): string {
  let p = raw.trim();
  if (p.startsWith('"')) {
    let j = 1;
    while (j < p.length && !(p[j] === '"' && p[j - 1] !== "\\")) j++;
    p = unquote(p.slice(0, j + 1));
  } else {
    const tab = p.indexOf("\t");
    if (tab >= 0) p = p.slice(0, tab);
    // GNU diff without a tab: "file 2024-01-01 10:00:00.000000000 +0000"
    p = p.replace(/\s+\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)? [+-]\d{4}$/, "");
  }
  return p;
}

const stripPrefix = (p: string, prefix: "a/" | "b/") => (p.startsWith(prefix) ? p.slice(2) : p);

/** Paths from `diff --git a/x b/y`, including quoted names and names that contain spaces. */
function gitHeaderPaths(rest: string): [string, string] | null {
  if (rest.startsWith('"')) {
    let j = 1;
    while (j < rest.length && !(rest[j] === '"' && rest[j - 1] !== "\\")) j++;
    const a = unquote(rest.slice(0, j + 1));
    const b = headerPath(rest.slice(j + 2));
    return [stripPrefix(a, "a/"), stripPrefix(unquote(b), "b/")];
  }
  // Same name on both sides (the overwhelmingly common case): split exactly in half.
  const half = (rest.length - 1) / 2;
  if (Number.isInteger(half) && rest[half] === " ") {
    const a = rest.slice(0, half);
    const b = rest.slice(half + 1);
    if (stripPrefix(a, "a/") === stripPrefix(b, "b/"))
      return [stripPrefix(a, "a/"), stripPrefix(b, "b/")];
  }
  const split = rest.lastIndexOf(" b/");
  if (split > 0) return [stripPrefix(rest.slice(0, split), "a/"), rest.slice(split + 3)];
  const space = rest.indexOf(" ");
  return space > 0 ? [rest.slice(0, space), rest.slice(space + 1)] : null;
}

interface Draft {
  oldPath: string | null;
  newPath: string | null;
  added: boolean;
  deleted: boolean;
  renamed: boolean;
  binary: boolean;
  hunks: DiffHunk[];
}

function finish(d: Draft): DiffFile | null {
  const oldP = d.oldPath === "/dev/null" ? null : d.oldPath;
  const newP = d.newPath === "/dev/null" ? null : d.newPath;
  const added = d.added || (d.oldPath === "/dev/null" && newP != null);
  const deleted = d.deleted || (d.newPath === "/dev/null" && oldP != null);
  const path = (deleted ? oldP : newP) ?? oldP ?? newP;
  if (!path) return null;
  const renamed = !added && !deleted && oldP != null && newP != null && oldP !== newP;
  const file: DiffFile = {
    path,
    status: added ? "added" : deleted ? "deleted" : renamed || d.renamed ? "renamed" : "modified",
    hunks: d.hunks,
  };
  if (renamed && oldP) file.oldPath = oldP;
  if (d.binary) file.binary = true;
  return file;
}

/**
 * Parse a unified diff (`git diff`, `git show`, `diff -u`, or an agent's patch) into files and
 * hunks with old/new line numbers. Ignores commit headers and other noise; never throws.
 */
export function parseUnifiedDiff(input: string): DiffFile[] {
  const lines = input.replace(/\r\n?/g, "\n").split("\n");
  const files: DiffFile[] = [];
  let cur: Draft | null = null;
  const fresh = (): Draft => ({
    oldPath: null,
    newPath: null,
    added: false,
    deleted: false,
    renamed: false,
    binary: false,
    hunks: [],
  });
  const flush = () => {
    if (cur) {
      const f = finish(cur);
      if (f) files.push(f);
    }
    cur = null;
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;

    if (line.startsWith("diff --git ") || line.startsWith("diff --cc ")) {
      flush();
      cur = fresh();
      const paths = gitHeaderPaths(line.slice(line.indexOf(" ", 5) + 1));
      if (paths) [cur.oldPath, cur.newPath] = paths;
      i++;
      continue;
    }

    // A `---` immediately followed by `+++` is a file header. Outside `diff --git` blocks (plain
    // `diff -u` output, or several patches pasted together) it starts a new file.
    if (line.startsWith("--- ") && lines[i + 1]?.startsWith("+++ ")) {
      // Inside a `diff --git` block that has no hunks yet, this header belongs to it.
      if (!cur || (cur as Draft).hunks.length > 0) {
        flush();
        cur = fresh();
      }
      const d = cur as Draft;
      const oldP = headerPath(line.slice(4));
      const newP = headerPath(lines[i + 1]!.slice(4));
      d.oldPath = oldP === "/dev/null" ? oldP : stripPrefix(oldP, "a/");
      d.newPath = newP === "/dev/null" ? newP : stripPrefix(newP, "b/");
      i += 2;
      continue;
    }

    const hunk = HUNK_RE.exec(line);
    if (hunk) {
      if (!cur) cur = fresh();
      const h: DiffHunk = {
        oldStart: Number(hunk[1]),
        oldLines: hunk[2] === undefined ? 1 : Number(hunk[2]),
        newStart: Number(hunk[3]),
        newLines: hunk[4] === undefined ? 1 : Number(hunk[4]),
        lines: [],
      };
      const section = hunk[5]?.trim();
      if (section) h.section = section;
      let oldLeft = h.oldLines;
      let newLeft = h.newLines;
      let oldNo = h.oldStart;
      let newNo = h.newStart;
      i++;
      while (i < lines.length) {
        const l = lines[i]!;
        const c = l[0];
        if (c === "\\") {
          const last = h.lines[h.lines.length - 1];
          if (last) last.noNewline = true;
          i++;
          continue;
        }
        if (oldLeft <= 0 && newLeft <= 0) break;
        // Counts may be wrong in hand-written or model-written patches: never swallow the next
        // file's header or hunk.
        if (l.startsWith("diff --git ") || HUNK_RE.test(l)) break;
        if (
          l.startsWith("--- ") &&
          lines[i + 1]?.startsWith("+++ ") &&
          HUNK_RE.test(lines[i + 2] ?? "")
        )
          break;
        if (c === " " || l === "") {
          // A blank line is a context line whose trailing space was stripped by an editor —
          // unless it is the very end of the input.
          if (l === "" && i === lines.length - 1) break;
          h.lines.push({
            kind: "context",
            content: l.slice(1),
            oldNumber: oldNo++,
            newNumber: newNo++,
          });
          oldLeft--;
          newLeft--;
        } else if (c === "-") {
          h.lines.push({ kind: "remove", content: l.slice(1), oldNumber: oldNo++ });
          oldLeft--;
        } else if (c === "+") {
          h.lines.push({ kind: "add", content: l.slice(1), newNumber: newNo++ });
          newLeft--;
        } else {
          break;
        }
        i++;
      }
      // Trust what was actually read when the header lied.
      h.oldLines = h.lines.filter((x) => x.kind !== "add").length;
      h.newLines = h.lines.filter((x) => x.kind !== "remove").length;
      cur.hunks.push(h);
      continue;
    }

    if (cur && cur.hunks.length === 0) {
      if (line.startsWith("new file mode")) cur.added = true;
      else if (line.startsWith("deleted file mode")) cur.deleted = true;
      else if (line.startsWith("rename from ") || line.startsWith("copy from ")) {
        cur.oldPath = unquote(line.slice(line.indexOf(" from ") + 6));
        cur.renamed = true;
      } else if (line.startsWith("rename to ") || line.startsWith("copy to ")) {
        cur.newPath = unquote(line.slice(line.indexOf(" to ") + 4));
        cur.renamed = true;
      } else if (line.startsWith("Binary files ") || line.startsWith("GIT binary patch")) {
        cur.binary = true;
        const m = /^Binary files (.+) and (.+) differ$/.exec(line);
        if (m && cur.oldPath === null) {
          cur.oldPath = m[1] === "/dev/null" ? m[1] : stripPrefix(m[1]!, "a/");
          cur.newPath = m[2] === "/dev/null" ? m[2] : stripPrefix(m[2]!, "b/");
        }
        if (m?.[1] === "/dev/null") cur.added = true;
        if (m?.[2] === "/dev/null") cur.deleted = true;
      }
    }
    i++;
  }
  flush();
  return files;
}

/** Turn structured input (possibly with raw `"+line"` strings and no positions) into DiffFiles. */
export function normalizeFiles(input: readonly DiffFileInput[]): DiffFile[] {
  return input.map((f) => {
    const hunks = f.hunks.map((h) => {
      const oldStart = h.oldStart ?? h.newStart ?? 1;
      const newStart = h.newStart ?? h.oldStart ?? 1;
      let oldNo = oldStart;
      let newNo = newStart;
      const lines: DiffLine[] = [];
      for (const raw of h.lines) {
        if (typeof raw !== "string") {
          const l: DiffLine = { ...raw };
          if (l.kind !== "add") {
            l.oldNumber ??= oldNo;
            oldNo = l.oldNumber + 1;
          }
          if (l.kind !== "remove") {
            l.newNumber ??= newNo;
            newNo = l.newNumber + 1;
          }
          lines.push(l);
          continue;
        }
        if (raw.startsWith("\\")) {
          const last = lines[lines.length - 1];
          if (last) last.noNewline = true;
        } else if (raw.startsWith("+"))
          lines.push({ kind: "add", content: raw.slice(1), newNumber: newNo++ });
        else if (raw.startsWith("-"))
          lines.push({ kind: "remove", content: raw.slice(1), oldNumber: oldNo++ });
        else
          lines.push({
            kind: "context",
            content: raw.startsWith(" ") ? raw.slice(1) : raw,
            oldNumber: oldNo++,
            newNumber: newNo++,
          });
      }
      const hunk: DiffHunk = {
        oldStart,
        newStart,
        oldLines: lines.filter((l) => l.kind !== "add").length,
        newLines: lines.filter((l) => l.kind !== "remove").length,
        lines,
      };
      if (h.id) hunk.id = h.id;
      if (h.section) hunk.section = h.section;
      return hunk;
    });
    const status: DiffFileStatus =
      f.status ?? (f.oldPath && f.oldPath !== f.path ? "renamed" : "modified");
    const file: DiffFile = { path: f.path, status, hunks };
    if (f.oldPath) file.oldPath = f.oldPath;
    if (f.language) file.language = f.language;
    if (f.binary) file.binary = true;
    return file;
  });
}

/** The id DiffView uses for a hunk's review state. */
export function hunkId(file: Pick<DiffFile, "path">, hunk: Pick<DiffHunk, "id">, index: number) {
  return hunk.id ?? `${file.path}#${index}`;
}

export function countChanges(files: readonly DiffFile[]): { additions: number; deletions: number } {
  let additions = 0;
  let deletions = 0;
  for (const f of files)
    for (const h of f.hunks)
      for (const l of h.lines) {
        if (l.kind === "add") additions++;
        else if (l.kind === "remove") deletions++;
      }
  return { additions, deletions };
}

const EXT_LANGUAGE: Record<string, string> = {
  ts: "ts",
  tsx: "tsx",
  mts: "ts",
  cts: "ts",
  js: "js",
  jsx: "jsx",
  mjs: "js",
  cjs: "js",
  json: "json",
  jsonc: "jsonc",
  json5: "json5",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  py: "python",
  css: "css",
  scss: "scss",
  html: "html",
  xml: "xml",
  svg: "svg",
  vue: "vue",
  yml: "yaml",
  yaml: "yaml",
  toml: "toml",
  sql: "sql",
  go: "go",
  rs: "rust",
  java: "java",
  kt: "kotlin",
  swift: "swift",
  c: "c",
  h: "c",
  cc: "cpp",
  cpp: "cpp",
  hpp: "cpp",
  cs: "csharp",
  php: "php",
  rb: "ruby",
};

/** Highlighting language for a path, from its extension ("text" when unknown). */
export function languageFromPath(path: string): string {
  const name = path.slice(path.lastIndexOf("/") + 1).toLowerCase();
  if (name === "dockerfile" || name.endsWith(".env") || name.startsWith(".env")) return "bash";
  const dot = name.lastIndexOf(".");
  return dot > 0 ? (EXT_LANGUAGE[name.slice(dot + 1)] ?? "text") : "text";
}

// --- word-level (intra-line) changes -----------------------------------------------------------

/** Half-open character ranges `[start, end)` that changed within a line. */
export type Ranges = Array<[number, number]>;

const WORD_RE = /[A-Za-z0-9_$]+|\s+|[=<>!&|+\-*/%^~?:]+|[^A-Za-z0-9_$\s]/g;

/**
 * Character ranges that differ between an old and a new line, at word granularity (LCS over
 * word / space / punctuation tokens). Returns null when the lines are too different for word
 * highlights to help (then the whole line is the change).
 */
export function wordDiff(a: string, b: string): { old: Ranges; new: Ranges } | null {
  if (a === b) return { old: [], new: [] };
  const ta = a.match(WORD_RE) ?? [];
  const tb = b.match(WORD_RE) ?? [];
  if (ta.length * tb.length > 40_000) return null;
  const n = ta.length;
  const m = tb.length;
  // LCS table, (n+1) × (m+1), filled from the end.
  const dp = new Uint16Array((n + 1) * (m + 1));
  const at = (i: number, j: number) => i * (m + 1) + j;
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[at(i, j)] =
        ta[i] === tb[j]
          ? dp[at(i + 1, j + 1)]! + 1
          : Math.max(dp[at(i + 1, j)]!, dp[at(i, j + 1)]!);
  const keepA = new Array<boolean>(n).fill(false);
  const keepB = new Array<boolean>(m).fill(false);
  let i = 0;
  let j = 0;
  let common = 0;
  while (i < n && j < m) {
    if (ta[i] === tb[j]) {
      keepA[i] = true;
      keepB[j] = true;
      if (/\S/.test(ta[i]!)) common += ta[i]!.length;
      i++;
      j++;
    } else if (dp[at(i + 1, j)]! >= dp[at(i, j + 1)]!) i++;
    else j++;
  }
  // Too little in common: highlighting words would just paint the whole line.
  const solid = (s: string) => s.replace(/\s+/g, "").length;
  if (common < 0.35 * Math.max(solid(a), solid(b))) return null;
  const toRanges = (tokens: string[], keep: boolean[]): Ranges => {
    const out: Ranges = [];
    let pos = 0;
    tokens.forEach((t, k) => {
      if (!keep[k]) {
        const last = out[out.length - 1];
        // Merge across a single kept whitespace token so "foo bar" reads as one change.
        if (last && last[1] === pos) last[1] = pos + t.length;
        else out.push([pos, pos + t.length]);
      }
      pos += t.length;
    });
    // Join ranges separated only by whitespace.
    const joined: Ranges = [];
    const text = tokens.join("");
    for (const r of out) {
      const prev = joined[joined.length - 1];
      if (prev && /^\s*$/.test(text.slice(prev[1], r[0]))) prev[1] = r[1];
      else joined.push([r[0], r[1]]);
    }
    // Hug the changed tokens: no marks on leading/trailing whitespace.
    return joined
      .map(([start, end]): [number, number] => {
        while (start < end && /\s/.test(text[start]!)) start++;
        while (end > start && /\s/.test(text[end - 1]!)) end--;
        return [start, end];
      })
      .filter(([start, end]) => end > start);
  };
  return { old: toRanges(ta, keepA), new: toRanges(tb, keepB) };
}

/**
 * Pair removed and added lines inside each change block of a hunk (a run of removals followed
 * by a run of additions) and compute word ranges for each pair. Keyed by line index.
 */
export function intraLineChanges(lines: readonly DiffLine[]): Map<number, Ranges> {
  const out = new Map<number, Ranges>();
  let k = 0;
  while (k < lines.length) {
    if (lines[k]!.kind !== "remove") {
      k++;
      continue;
    }
    const removes: number[] = [];
    while (k < lines.length && lines[k]!.kind === "remove") removes.push(k++);
    const adds: number[] = [];
    while (k < lines.length && lines[k]!.kind === "add") adds.push(k++);
    const pairs = Math.min(removes.length, adds.length);
    for (let p = 0; p < pairs; p++) {
      const r = removes[p]!;
      const a = adds[p]!;
      const d = wordDiff(lines[r]!.content, lines[a]!.content);
      if (!d) continue;
      if (d.old.length) out.set(r, d.old);
      if (d.new.length) out.set(a, d.new);
    }
  }
  return out;
}
