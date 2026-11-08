import type { ThemeRegistration } from "shiki";

/** Code set in sumi on washi: ink text, vermilion keywords, matcha strings, indigo calls. */
function theme(
  name: string,
  type: "light" | "dark",
  c: Record<
    "fg" | "kw" | "str" | "fn" | "num" | "type" | "tag" | "attr" | "comment" | "punct",
    string
  >,
): ThemeRegistration {
  return {
    name,
    type,
    colors: { "editor.foreground": c.fg, "editor.background": "#00000000" },
    tokenColors: [
      {
        scope: ["comment", "punctuation.definition.comment"],
        settings: { foreground: c.comment, fontStyle: "italic" },
      },
      {
        scope: ["keyword", "storage", "storage.type", "keyword.operator.new", "keyword.control"],
        settings: { foreground: c.kw },
      },
      {
        scope: ["string", "string.template", "punctuation.definition.string"],
        settings: { foreground: c.str },
      },
      {
        scope: ["entity.name.function", "support.function", "meta.function-call"],
        settings: { foreground: c.fn },
      },
      {
        scope: ["constant.numeric", "constant.language", "constant.other"],
        settings: { foreground: c.num },
      },
      {
        scope: [
          "entity.name.type",
          "support.type",
          "support.class",
          "entity.other.inherited-class",
        ],
        settings: { foreground: c.type },
      },
      { scope: ["entity.name.tag", "support.class.component"], settings: { foreground: c.tag } },
      { scope: ["entity.other.attribute-name"], settings: { foreground: c.attr } },
      {
        scope: ["punctuation", "meta.brace", "keyword.operator"],
        settings: { foreground: c.punct },
      },
      {
        scope: ["variable", "variable.other", "meta.object-literal.key"],
        settings: { foreground: c.fg },
      },
    ],
  };
}

export const washi = theme("kura-washi", "light", {
  fg: "#2a2722",
  kw: "#b3401a",
  str: "#4f6b2c",
  fn: "#2f4f8a",
  num: "#9a6a12",
  type: "#2f4f8a",
  tag: "#b3401a",
  attr: "#6c665b",
  comment: "#8a8476",
  punct: "#6c665b",
});

export const sumi = theme("kura-sumi", "dark", {
  fg: "#e9e2d4",
  kw: "#f0855a",
  str: "#a9c47e",
  fn: "#9db4e6",
  num: "#e2b45c",
  type: "#9db4e6",
  tag: "#f0855a",
  attr: "#b3ab9b",
  comment: "#8a8476",
  punct: "#a59e90",
});
