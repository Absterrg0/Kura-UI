import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

const config: NextConfig = {
  reactStrictMode: true,
  // The docs render the library from source (packages/react/src) for instant HMR.
  transpilePackages: ["@kura-ui/react"],
  turbopack: { root },
  outputFileTracingRoot: root,
  async headers() {
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
  },
};

export default config;
