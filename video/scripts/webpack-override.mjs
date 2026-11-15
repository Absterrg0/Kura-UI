// The film's webpack setup, shared by the Remotion CLI (remotion.config.ts) and scripts/stills.mjs.
import path from "node:path";
import { enableTailwind } from "@remotion/tailwind-v4";
import webpack from "webpack";

const here = process.cwd();
const lib = path.resolve(here, "../packages/react");
const own = (m) => path.resolve(here, "node_modules", m);

/** Library hooks that read real time are swapped for film-clock versions (src/shims). */
const shim = (name) =>
  new webpack.NormalModuleReplacementPlugin(
    new RegExp(`hooks[\\\\/]${name}$`),
    path.resolve(here, "src/shims", `${name}.ts`),
  );

export function webpackOverride(config) {
  const withTailwind = enableTailwind(config);
  return {
    ...withTailwind,
    plugins: [...(withTailwind.plugins ?? []), shim("use-elapsed"), shim("use-reduced-motion")],
    resolve: {
      ...withTailwind.resolve,
      alias: {
        ...(withTailwind.resolve?.alias ?? {}),
        // One React for the film and the library source it renders. The library's own imports
        // (@ui-sdk, lucide, motion…) resolve from its package as usual.
        react: own("react"),
        "react-dom": own("react-dom"),
        "@kura": path.resolve(lib, "src"),
        // Geist ships its font files outside its exports map.
        "@geist-fonts": own("geist/dist/fonts"),
      },
    },
  };
}
