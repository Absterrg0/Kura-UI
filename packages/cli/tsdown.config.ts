import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: "esm",
  platform: "node",
  target: "node20",
  dts: false,
  clean: true,
  hash: false,
  fixedExtension: false,
  banner: { js: "#!/usr/bin/env node" },
});
