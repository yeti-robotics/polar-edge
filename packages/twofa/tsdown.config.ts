import { defineConfig } from "tsdown";

export default defineConfig([
  {
    entry: {
      index: "src/index.ts",
      client: "src/client/index.ts",
      server: "src/server/index.ts",
    },
    format: ["esm", "cjs"],
    outDir: "dist",
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    target: false,
  },
]);
