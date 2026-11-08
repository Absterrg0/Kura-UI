/**
 * A small, synchronous, zero-dependency syntax tokenizer. It is not a full grammar engine like
 * shiki; it is a careful set of sticky regexes per language family that gets the common cases
 * right, runs in microseconds, and — being synchronous — never flashes unhighlighted code.
 */

export type CodeTokenType =
  | "plain"
  | "keyword"
  | "string"
  | "comment"
  | "number"
  | "constant"
  | "function"
  | "type"
  | "tag"
  | "attr"
  | "property"
  | "variable"
  | "punctuation"
  | "operator";

export interface CodeToken {
  type: CodeTokenType;
  text: string;
}

type Rule = readonly [CodeTokenType, RegExp];

const kw = (words: string, flags = "y") => new RegExp(`\\b(?:${words})\\b`, flags);

const DQ = /"(?:\\.|[^"\\\n])*"?/y;
const SQ = /'(?:\\.|[^'\\\n])*'?/y;
const NUM = /\b(?:0[xXbBoO][\da-fA-F_]+|\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?n?)\b/y;
const IDENT = /[A-Za-z_$][\w$]*/y;
const CALL = /[A-Za-z_$][\w$]*(?=\s*\()/y;
const TYPE = /\b[A-Z][\w$]*\b/y;
const PROP = /(?<=\.)[A-Za-z_$][\w$]*/y;
const PUNCT = /[{}()[\];,.]/y;
const OP = /=>|[=+\-*/%!&|^~?:<>]+/y;

const JS_KEYWORDS =
  "abstract|as|async|await|break|case|catch|class|const|continue|debugger|declare|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|infer|instanceof|interface|is|keyof|let|namespace|new|of|private|protected|public|readonly|return|satisfies|set|static|super|switch|this|throw|try|type|typeof|var|void|while|with|yield";

const js: Rule[] = [
  ["comment", /\/\/[^\n]*/y],
  ["comment", /\/\*[\s\S]*?(?:\*\/|$)/y],
  ["string", /`(?:\\[\s\S]|[^\\`])*`?/y],
  ["string", DQ],
  ["string", SQ],
  ["tag", /(?<=<\/?)[A-Za-z][\w.]*/y],
  ["attr", /[A-Za-z_$][\w$-]*(?==(?!=|>))/y],
  ["constant", kw("true|false|null|undefined|NaN|Infinity")],
  ["keyword", kw(JS_KEYWORDS)],
  ["number", NUM],
  ["function", CALL],
  ["type", TYPE],
  ["property", PROP],
  ["plain", IDENT],
  ["punctuation", PUNCT],
  ["operator", OP],
];

const json: Rule[] = [
  ["property", /"(?:\\.|[^"\\\n])*"(?=\s*:)/y],
  ["string", DQ],
  ["number", /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/y],
  ["constant", kw("true|false|null")],
  ["punctuation", /[{}[\],:]/y],
];

const bash: Rule[] = [
  ["comment", /(?<=^|\s)#[^\n]*/my],
  ["string", /"(?:\\[\s\S]|[^"\\])*"?/y],
  ["string", /'[^']*'?/y],
  ["variable", /\$(?:\{[^}\n]*\}|\w+|[@#?$!*0-9])/y],
  [
    "keyword",
    kw("if|then|else|elif|fi|for|while|until|do|done|in|case|esac|function|export|local|return"),
  ],
  ["function", /(?<=(?:^|[|;&(]|&&|\|\|)[ \t]*(?:sudo[ \t]+)?)[A-Za-z_.][\w./-]*/my],
  ["attr", /(?<=\s)--?[A-Za-z][\w-]*/y],
  ["number", /\b\d+\b/y],
  ["operator", /[|&;<>]+|=/y],
];

const python: Rule[] = [
  ["comment", /#[^\n]*/y],
  [
    "string",
    /[rbfuRBFU]{0,2}(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)/y,
  ],
  ["attr", /@[\w.]+/y],
  ["constant", kw("True|False|None")],
  [
    "keyword",
    kw(
      "and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield|match|case|self",
    ),
  ],
  ["number", NUM],
  ["function", /(?<=\bdef\s+)\w+/y],
  ["function", CALL],
  ["type", TYPE],
  ["property", PROP],
  ["plain", IDENT],
  ["punctuation", PUNCT],
  ["operator", OP],
];

const css: Rule[] = [
  ["comment", /\/\*[\s\S]*?(?:\*\/|$)/y],
  ["keyword", /@[\w-]+/y],
  ["string", DQ],
  ["string", SQ],
  ["variable", /--[\w-]+/y],
  ["number", /#[\da-fA-F]{3,8}\b/y],
  ["property", /(?<=[{;\s])[a-z-]+(?=\s*:[^:])/y],
  ["function", /[\w-]+(?=\()/y],
  ["number", /-?(?:\d*\.)?\d+(?:px|rem|em|%|ms|s|vh|vw|dvh|deg|fr|ch)?\b%?/y],
  ["tag", /[.#][\w-]+|&/y],
  ["constant", /!important/y],
  ["plain", /[\w-]+/y],
  ["punctuation", /[{}();,:]/y],
];

const markup: Rule[] = [
  ["comment", /<!--[\s\S]*?(?:-->|$)/y],
  ["tag", /(?<=<\/?)[\w:-]+/y],
  ["attr", /[\w:@.-]+(?==)/y],
  ["string", DQ],
  ["string", SQ],
  ["punctuation", /<\/?|\/?>|=/y],
];

const yaml: Rule[] = [
  ["comment", /(?<=^|\s)#[^\n]*/my],
  ["property", /(?<=^[ \t]*(?:- )?)[\w.$-]+(?=\s*:(?:\s|$))/my],
  ["string", DQ],
  ["string", SQ],
  ["constant", kw("true|false|null|yes|no|on|off")],
  ["number", /-?\b\d+(?:\.\d+)?\b/y],
  ["punctuation", /[-:[\]{},|>]/y],
];

const sql: Rule[] = [
  ["comment", /--[^\n]*/y],
  ["comment", /\/\*[\s\S]*?(?:\*\/|$)/y],
  ["string", SQ],
  ["string", DQ],
  [
    "keyword",
    kw(
      "select|from|where|and|or|not|insert|into|values|update|set|delete|create|table|index|drop|alter|add|join|left|right|inner|outer|on|group|by|order|having|limit|offset|as|distinct|union|all|case|when|then|else|end|in|is|null|primary|key|references|default|returning|with|asc|desc|exists|like",
      "iy",
    ),
  ],
  ["number", NUM],
  ["function", CALL],
  ["plain", /\w+/y],
  ["punctuation", /[(),;.*]/y],
  ["operator", /[=<>!+\-/%]+/y],
];

function cLike(keywords: string, extra: Rule[] = []): Rule[] {
  return [
    ["comment", /\/\/[^\n]*/y],
    ["comment", /\/\*[\s\S]*?(?:\*\/|$)/y],
    ...extra,
    ["string", /`[^`]*`?/y],
    ["string", DQ],
    ["string", SQ],
    ["constant", kw("true|false|nil|null|None|Some|Ok|Err|iota")],
    ["keyword", kw(keywords)],
    ["number", NUM],
    ["function", /[A-Za-z_][\w]*!?(?=\s*\()/y],
    ["type", TYPE],
    ["property", PROP],
    ["plain", IDENT],
    ["punctuation", PUNCT],
    ["operator", OP],
  ];
}

const go = cLike(
  "break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go|goto|if|import|interface|map|package|range|return|select|struct|switch|type|var|string|int|int64|float64|bool|error|byte|rune|any",
);
const rust = cLike(
  "as|async|await|break|const|continue|crate|dyn|else|enum|extern|fn|for|if|impl|in|let|loop|match|mod|move|mut|pub|ref|return|self|Self|static|struct|super|trait|type|unsafe|use|where|while|i32|i64|u8|u32|u64|usize|f64|bool|str|String|Vec|Option|Result",
  [["attr", /#!?\[[^\]\n]*\]/y]],
);
const generic = cLike(
  "abstract|break|case|catch|class|const|continue|default|do|else|enum|extends|final|finally|for|if|implements|import|interface|new|package|private|protected|public|return|static|struct|switch|this|throw|throws|try|void|while|fun|val|var|let|func|def|end",
);

const LANGUAGES: Record<string, Rule[]> = {
  js,
  javascript: js,
  jsx: js,
  mjs: js,
  cjs: js,
  ts: js,
  typescript: js,
  tsx: js,
  json,
  jsonc: js,
  json5: js,
  bash,
  sh: bash,
  shell: bash,
  zsh: bash,
  console: bash,
  python: python,
  py: python,
  css,
  scss: css,
  html: markup,
  xml: markup,
  svg: markup,
  vue: markup,
  yaml,
  yml: yaml,
  toml: yaml,
  sql,
  go,
  rust,
  rs: rust,
  java: generic,
  kotlin: generic,
  swift: generic,
  c: generic,
  cpp: generic,
  csharp: generic,
  cs: generic,
  php: generic,
  ruby: generic,
};

/** Languages with a dedicated tokenizer (aliases included). Anything else renders as plain text. */
export const supportedLanguages = Object.keys(LANGUAGES);

/** Tokenize `code` and split the result into lines (tokens never span a newline). */
export function highlightCode(code: string, language = "text"): CodeToken[][] {
  const rules = LANGUAGES[language.toLowerCase()];
  const lines: CodeToken[][] = [[]];
  const push = (type: CodeTokenType, text: string) => {
    const parts = text.split("\n");
    parts.forEach((part, i) => {
      if (i > 0) lines.push([]);
      if (!part) return;
      const line = lines[lines.length - 1]!;
      const last = line[line.length - 1];
      if (last && last.type === type) last.text += part;
      else line.push({ type, text: part });
    });
  };
  if (!rules) {
    push("plain", code);
    return lines;
  }
  let i = 0;
  outer: while (i < code.length) {
    for (const [type, re] of rules) {
      re.lastIndex = i;
      const m = re.exec(code);
      if (m && m[0].length > 0) {
        push(type, m[0]);
        i += m[0].length;
        continue outer;
      }
    }
    push("plain", code[i]!);
    i++;
  }
  return lines;
}
