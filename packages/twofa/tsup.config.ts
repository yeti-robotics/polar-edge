import { defineConfig } from "tsup";

const entry = {
  index: "src/core/index.ts",
  client: "src/client/index.ts",
  server: "src/server/index.ts",
};

const base = {
  entry,
  splitting: true,
  sourcemap: true,
  treeshake: true,
  clean: true,
  dts: true,
  target: "es2022",
  platform: "neutral" as const,
  shims: false,
  minify: false,
  external: ["node:crypto", "crypto"],
};

export default defineConfig([
  {
    ...base,
    format: ["esm"],
    outDir: "dist/esm",
    outExtension: () => ({ js: ".js" }),
  },
  {
    ...base,
    format: ["cjs"],
    outDir: "dist/cjs",
    outExtension: () => ({ js: ".cjs" }),
  },
]);
