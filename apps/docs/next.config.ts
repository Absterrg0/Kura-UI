import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

/**
 * `NEXT_OUTPUT=export` (used by `pnpm build:site`) emits a fully static site to apps/docs/out for
 * Cloudflare Pages. Every route is static/SSG, so nothing is lost; the response headers below are
 * mirrored for the static host in public/_headers.
 */
const staticExport = process.env.NEXT_OUTPUT === "export";

const config: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  ...(staticExport ? { output: "export" as const, trailingSlash: false } : {}),
  // The docs render the library from source (packages/react/src) for instant HMR.
  transpilePackages: ["@kura-ui/react"],
  turbopack: { root },
  outputFileTracingRoot: root,
  // headers() is unsupported with output: "export" (public/_headers covers it there).
  ...(staticExport ? {} : { headers }),
};

async function headers() {
  return [
    {
      source: "/components/:slug.md",
      headers: [{ key: "Content-Type", value: "text/markdown; charset=utf-8" }],
    },
    ...["/llms.txt", "/llms-full.txt"].map((source) => ({
      source,
      headers: [{ key: "Content-Type", value: "text/plain; charset=utf-8" }],
    })),
    {
      source: "/r/:path*",
      headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
    },
    {
      source: "/registry/:path*",
      headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
    },
  ];
}

export default config;
