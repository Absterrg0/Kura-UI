import "server-only";
import { createCssVariablesTheme, createHighlighter, type Highlighter } from "shiki";

/**
 * One theme, written in CSS variables. The variables are set in globals.css from Kura's three
 * inks, so code is monochrome and follows the page's theme without a second render.
 */
const ink = createCssVariablesTheme({
  name: "kura-ink",
  variablePrefix: "--shiki-",
  variableDefaults: {},
  fontStyle: false,
});

let highlighter: Promise<Highlighter> | undefined;

function get() {
  highlighter ??= createHighlighter({
    themes: [ink],
    langs: ["tsx", "ts", "bash", "json", "css", "glsl", "markdown", "toml"],
  });
  return highlighter;
}

/** Server-side syntax highlighting in Kura's inks. */
export async function highlight(code: string, lang = "tsx"): Promise<string> {
  const h = await get();
  // Shiki would add tabindex="0" to its <pre>; the pane around it is already the tab stop.
  return h.codeToHtml(code.trimEnd(), { lang, theme: "kura-ink", tabindex: false });
}
