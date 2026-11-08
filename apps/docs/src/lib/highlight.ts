import "server-only";
import { createHighlighter, type Highlighter } from "shiki";

let highlighter: Promise<Highlighter> | undefined;

function get() {
  highlighter ??= createHighlighter({
    themes: ["vitesse-light", "vitesse-dark"],
    langs: ["tsx", "ts", "bash", "json", "css", "glsl", "markdown", "toml"],
  });
  return highlighter;
}

/** Server-side syntax highlighting with light/dark themes switched by CSS variables. */
export async function highlight(code: string, lang = "tsx"): Promise<string> {
  const h = await get();
  return h.codeToHtml(code.trimEnd(), {
    lang,
    themes: { light: "vitesse-light", dark: "vitesse-dark" },
    defaultColor: false,
  });
}
