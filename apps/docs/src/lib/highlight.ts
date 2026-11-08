import "server-only";
import { createHighlighter, type Highlighter } from "shiki";
import { sumi, washi } from "./shiki-themes";

let highlighter: Promise<Highlighter> | undefined;

function get() {
  highlighter ??= createHighlighter({
    themes: [washi, sumi],
    langs: ["tsx", "ts", "bash", "json", "css", "glsl", "markdown", "toml"],
  });
  return highlighter;
}

/** Server-side syntax highlighting with light/dark themes switched by CSS variables. */
export async function highlight(code: string, lang = "tsx"): Promise<string> {
  const h = await get();
  return h.codeToHtml(code.trimEnd(), {
    lang,
    themes: { light: "kura-washi", dark: "kura-sumi" },
    defaultColor: false,
  });
}
