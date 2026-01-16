import path from "node:path";
import { fileURLToPath } from "node:url";
import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";
import { sharedConfig } from "@repo/vitest-config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  ...sharedConfig,
  plugins: [
    // This is required to build the test files with SWC
    swc.vite({
      // Explicitly set the module type to avoid inheriting this value from a `.swcrc` config file
      module: {
        type: "es6",
      },
      jsc: {
        parser: {
          syntax: "typescript",
          decorators: true,
          dynamicImport: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
      },
    }),
  ],
  resolve: {
    alias: {
      // Ensure Vitest correctly resolves TypeScript path aliases
      src: path.resolve(__dirname, "./src"),
    },
  },
  test: {
    ...sharedConfig.test,
    include: ["src/**/*.spec.ts"],
    root: "./",
  },
});
