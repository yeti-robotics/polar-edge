import path from "node:path";
import { fileURLToPath } from "node:url";
import { sharedConfig } from "@repo/vitest-config";
import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  ...sharedConfig,
  plugins: [
    swc.vite({
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
      src: path.resolve(__dirname, "./src"),
    },
  },
  test: {
    ...sharedConfig.test,
    include: ["**/*.e2e-spec.ts"],
    root: "./",
  },
});
