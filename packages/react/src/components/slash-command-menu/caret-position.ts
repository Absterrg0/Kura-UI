/**
 * Viewport coordinates of a character offset inside a <textarea> or <input>, measured with an
 * off-screen mirror element that copies the field's text layout. Browser-only; returns null
 * during SSR.
 */
export interface CaretRect {
  /** Viewport x of the caret's left edge. */
  left: number;
  /** Viewport y of the top of the caret's line. */
  top: number;
  /** Line height in px. */
  height: number;
}

const COPIED = [
  "direction",
  "boxSizing",
  "width",
  "overflowX",
  "overflowY",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderStyle",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "fontStretch",
  "fontSize",
  "fontSizeAdjust",
  "lineHeight",
  "fontFamily",
  "fontFeatureSettings",
  "fontVariationSettings",
  "textAlign",
  "textTransform",
  "textIndent",
  "textDecoration",
  "letterSpacing",
  "wordSpacing",
  "tabSize",
] as const;

export function getCaretRect(
  field: HTMLTextAreaElement | HTMLInputElement,
  offset: number,
): CaretRect | null {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  const rect = field.getBoundingClientRect();

  const style = window.getComputedStyle(field);
  const mirror = document.createElement("div");
  const isInput = field.tagName === "INPUT";
  const s = mirror.style;
  for (const prop of COPIED) s[prop] = style[prop];
  s.position = "absolute";
  s.visibility = "hidden";
  s.top = "0";
  s.left = "-9999px";
  s.whiteSpace = isInput ? "pre" : "pre-wrap";
  s.overflowWrap = isInput ? "normal" : "break-word";
  s.overflow = "hidden";
  s.height = "auto";

  mirror.textContent = field.value.slice(0, offset);
  const marker = document.createElement("span");
  // A zero-width marker would collapse; use the rest of the text so wrapping matches.
  marker.textContent = field.value.slice(offset) || ".";
  mirror.appendChild(marker);
  document.body.appendChild(mirror);

  const lineHeight =
    Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) * 1.25 || 20;
  const result: CaretRect = {
    left: rect.left + marker.offsetLeft - field.scrollLeft,
    top: rect.top + marker.offsetTop - field.scrollTop,
    height: lineHeight,
  };
  document.body.removeChild(mirror);
  return result;
}
