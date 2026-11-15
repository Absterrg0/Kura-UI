import geistMono from "@geist-fonts/geist-mono/GeistMono-Variable.woff2";
import geistSans from "@geist-fonts/geist-sans/Geist-Variable.woff2";
import { continueRender, delayRender } from "remotion";

/** The site's own faces, Geist and Geist Mono, loaded before the first frame is taken. */
let loading: Promise<void> | null = null;
export function loadFonts() {
  if (loading) return loading;
  const handle = delayRender("Loading Geist");
  const faces = [
    new FontFace("Geist", `url(${geistSans}) format("woff2")`, { weight: "100 900" }),
    new FontFace("Geist Mono", `url(${geistMono}) format("woff2")`, { weight: "100 900" }),
  ];
  loading = Promise.all(faces.map((f) => f.load())).then((loaded) => {
    for (const f of loaded) document.fonts.add(f);
    continueRender(handle);
  });
  return loading;
}
