/**
 * A small terminal "screen" for rendering command output: SGR colours and text styles, plus the
 * cursor controls real CLIs use for progress bars and spinners (`\r`, erase line, cursor up,
 * backspace). Fed incrementally, so streaming output is parsed once. Pure, no DOM.
 */

export type AnsiColor =
  | "black"
  | "red"
  | "green"
  | "yellow"
  | "blue"
  | "magenta"
  | "cyan"
  | "white"
  | "gray";

export interface AnsiStyle {
  fg?: AnsiColor;
  bg?: AnsiColor;
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
  inverse?: boolean;
  strike?: boolean;
}

export interface AnsiSpan {
  text: string;
  style: AnsiStyle;
}

export interface ScreenLine {
  text: string;
  /** Style id per character (index into the screen's style table). */
  styles: number[];
  /** Bumped on every change, for memoised rendering. */
  version: number;
}

const BASIC: AnsiColor[] = ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"];

function styleKey(s: AnsiStyle): string {
  return `${s.fg ?? ""}|${s.bg ?? ""}|${s.bold ? 1 : 0}${s.dim ? 1 : 0}${s.italic ? 1 : 0}${s.underline ? 1 : 0}${s.inverse ? 1 : 0}${s.strike ? 1 : 0}`;
}

/** Map a 256-colour index to the nearest basic colour (0–15 exactly, greys to gray). */
function color256(n: number): AnsiColor | undefined {
  if (n < 8) return BASIC[n];
  if (n === 8) return "gray";
  if (n < 16) return BASIC[n - 8];
  if (n >= 232) return n < 244 ? "gray" : "white";
  // 6×6×6 cube: pick the dominant channel.
  const v = n - 16;
  const r = Math.floor(v / 36);
  const g = Math.floor((v % 36) / 6);
  const b = v % 6;
  if (r === g && g === b) return r < 3 ? "gray" : "white";
  const max = Math.max(r, g, b);
  const hi = [r === max, g === max, b === max];
  if (hi[0] && hi[1]) return "yellow";
  if (hi[0] && hi[2]) return "magenta";
  if (hi[1] && hi[2]) return "cyan";
  return hi[0] ? "red" : hi[1] ? "green" : "blue";
}

function applySgr(style: AnsiStyle, params: number[]): AnsiStyle {
  let s: AnsiStyle = { ...style };
  if (params.length === 0) params = [0];
  for (let i = 0; i < params.length; i++) {
    const p = params[i]!;
    if (p === 0) s = {};
    else if (p === 1) s.bold = true;
    else if (p === 2) s.dim = true;
    else if (p === 3) s.italic = true;
    else if (p === 4) s.underline = true;
    else if (p === 7) s.inverse = true;
    else if (p === 9) s.strike = true;
    else if (p === 22) {
      s.bold = false;
      s.dim = false;
    } else if (p === 23) s.italic = false;
    else if (p === 24) s.underline = false;
    else if (p === 27) s.inverse = false;
    else if (p === 29) s.strike = false;
    else if (p >= 30 && p <= 37) s.fg = BASIC[p - 30];
    else if (p === 39) s.fg = undefined;
    else if (p >= 40 && p <= 47) s.bg = BASIC[p - 40];
    else if (p === 49) s.bg = undefined;
    else if (p >= 90 && p <= 97) s.fg = p === 90 ? "gray" : BASIC[p - 90];
    else if (p >= 100 && p <= 107) s.bg = p === 100 ? "gray" : BASIC[p - 100];
    else if (p === 38 || p === 48) {
      // 38;5;n / 38;2;r;g;b — extended colours, approximated to the nearest basic colour.
      const mode = params[i + 1];
      let c: AnsiColor | undefined;
      if (mode === 5) {
        c = color256(params[i + 2] ?? 0);
        i += 2;
      } else if (mode === 2) {
        const [r = 0, g = 0, b = 0] = params.slice(i + 2, i + 5);
        const max = Math.max(r, g, b);
        const n =
          16 +
          36 * Math.round((r / 255) * 5) +
          6 * Math.round((g / 255) * 5) +
          Math.round((b / 255) * 5);
        c = max < 40 ? "black" : color256(n);
        i += 4;
      }
      if (p === 38) s.fg = c;
      else s.bg = c;
    }
  }
  for (const k of Object.keys(s) as Array<keyof AnsiStyle>) if (!s[k]) delete s[k];
  return s;
}

export class AnsiScreen {
  lines: ScreenLine[] = [{ text: "", styles: [], version: 0 }];
  /** Style table; id 0 is the default style. */
  styles: AnsiStyle[] = [{}];
  private ids = new Map<string, number>([["||000000", 0]]);
  private style: AnsiStyle = {};
  private styleId = 0;
  private row = 0;
  private col = 0;
  /** An escape sequence split across chunks. */
  private pending = "";
  private version = 0;

  /** Feed more output. */
  write(chunk: string): void {
    const s = this.pending + chunk;
    this.pending = "";
    let i = 0;
    let run = "";
    const flush = () => {
      if (run) this.put(run);
      run = "";
    };
    while (i < s.length) {
      const ch = s[i]!;
      if (ch === "\x1b") {
        flush();
        const next = s[i + 1];
        if (next === undefined) {
          this.pending = s.slice(i);
          return;
        }
        if (next === "[") {
          // CSI: ESC [ params intermediates final
          const m = /^\[([0-?]*)([ -/]*)([@-~])/.exec(s.slice(i + 1, i + 64));
          if (!m) {
            if (s.length - i < 64 && /^\[[0-?]*[ -/]*$/.test(s.slice(i + 1))) {
              this.pending = s.slice(i);
              return;
            }
            i += 2;
            continue;
          }
          this.csi(m[1]!, m[3]!);
          i += m[0].length + 1;
          continue;
        }
        if (next === "]") {
          // OSC (titles, hyperlinks): skip to BEL or ESC \
          const bel = s.indexOf("\x07", i);
          const st = s.indexOf("\x1b\\", i);
          const end = bel < 0 ? st : st < 0 ? bel : Math.min(bel, st);
          if (end < 0) {
            this.pending = s.slice(i);
            return;
          }
          i = end + (end === st ? 2 : 1);
          continue;
        }
        // Two- or three-byte escapes (charset selection, save/restore cursor…): ignore.
        i += next === "(" || next === ")" ? 3 : 2;
        continue;
      }
      if (ch === "\n") {
        flush();
        this.row++;
        this.col = 0;
        this.ensureRow();
      } else if (ch === "\r") {
        flush();
        // \r\n is just a newline.
        if (s[i + 1] !== "\n") this.col = 0;
      } else if (ch === "\b") {
        flush();
        this.col = Math.max(0, this.col - 1);
      } else if (ch === "\x07" || (ch < " " && ch !== "\t")) {
        flush();
      } else {
        run += ch;
      }
      i++;
    }
    flush();
  }

  private ensureRow() {
    while (this.lines.length <= this.row)
      this.lines.push({ text: "", styles: [], version: ++this.version });
  }

  private touch(line: ScreenLine) {
    line.version = ++this.version;
  }

  private put(text: string) {
    this.ensureRow();
    const line = this.lines[this.row]!;
    if (this.col > line.text.length) {
      const pad = this.col - line.text.length;
      line.text += " ".repeat(pad);
      for (let k = 0; k < pad; k++) line.styles.push(0);
    }
    const end = this.col + text.length;
    line.text = line.text.slice(0, this.col) + text + line.text.slice(end);
    line.styles = line.styles
      .slice(0, this.col)
      .concat(new Array<number>(text.length).fill(this.styleId), line.styles.slice(end));
    this.col = end;
    this.touch(line);
  }

  private csi(rawParams: string, final: string) {
    const params = rawParams
      .replace(/^[?>=]/, "")
      .split(/[;:]/)
      .filter((p) => p !== "")
      .map(Number);
    const n = params[0] ?? 1;
    switch (final) {
      case "m": {
        this.style = applySgr(
          this.style,
          rawParams === "" ? [] : rawParams.split(/[;:]/).map((p) => Number(p) || 0),
        );
        const key = styleKey(this.style);
        let id = this.ids.get(key);
        if (id === undefined) {
          id = this.styles.length;
          this.styles.push(this.style);
          this.ids.set(key, id);
        }
        this.styleId = id;
        break;
      }
      case "A": // cursor up
      case "F":
        this.row = Math.max(0, this.row - n);
        if (final === "F") this.col = 0;
        break;
      case "B": // cursor down
      case "E":
        this.row += n;
        this.ensureRow();
        if (final === "E") this.col = 0;
        break;
      case "C":
        this.col += n;
        break;
      case "D":
        this.col = Math.max(0, this.col - n);
        break;
      case "G":
        this.col = Math.max(0, n - 1);
        break;
      case "K": {
        // erase in line: 0 = to end, 1 = to start, 2 = whole line
        this.ensureRow();
        const line = this.lines[this.row]!;
        const mode = params[0] ?? 0;
        if (mode === 0) {
          line.text = line.text.slice(0, this.col);
          line.styles.length = Math.min(line.styles.length, this.col);
        } else if (mode === 1) {
          line.text = " ".repeat(Math.min(this.col, line.text.length)) + line.text.slice(this.col);
          line.styles.fill(0, 0, this.col);
        } else {
          line.text = "";
          line.styles = [];
        }
        this.touch(line);
        break;
      }
      case "J": {
        // erase in display: 0 = below (and rest of line), 2/3 = everything
        const mode = params[0] ?? 0;
        if (mode === 0) {
          this.csi("0", "K");
          this.lines.length = this.row + 1;
        } else if (mode >= 2) {
          this.lines = [{ text: "", styles: [], version: ++this.version }];
          this.row = 0;
          this.col = 0;
        }
        break;
      }
      default:
        // Other CSI sequences (cursor show/hide, scroll regions, modes) don't affect text.
        break;
    }
  }

  /** The lines as styled spans. */
  spans(line: ScreenLine): AnsiSpan[] {
    const out: AnsiSpan[] = [];
    let start = 0;
    for (let k = 1; k <= line.text.length; k++) {
      if (k === line.text.length || line.styles[k] !== line.styles[start]) {
        out.push({ text: line.text.slice(start, k), style: this.styles[line.styles[start] ?? 0]! });
        start = k;
      }
    }
    return out;
  }
}

/** Parse a complete string into lines of styled spans. */
export function parseAnsi(text: string): AnsiSpan[][] {
  const screen = new AnsiScreen();
  screen.write(text);
  return screen.lines.map((l) => screen.spans(l));
}

/** Remove escape sequences and apply carriage returns: the text a user would copy. */
export function stripAnsi(text: string): string {
  const screen = new AnsiScreen();
  screen.write(text);
  return screen.lines.map((l) => l.text.replace(/\s+$/, "")).join("\n");
}
