import path from "node:path";
import { baseConfig } from "@repo/vitest-config";
import { mergeConfig } from "vitest/config";

export default mergeConfig(baseConfig, {
  test: {
    environmentMatchGlobs: [
      // Use jsdom for React component tests
      ["**/*.test.tsx", "jsdom"],
      // Use node for server actions and utilities
      ["**/*.test.ts", "node"],
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
    },
  },
});
