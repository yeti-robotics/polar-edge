import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "configs/base-config": "src/configs/base-config.ts",
    "configs/ui-config": "src/configs/ui-config.ts",
    "scripts/collect-json-outputs": "src/scripts/collect-json-outputs.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: false,
});
