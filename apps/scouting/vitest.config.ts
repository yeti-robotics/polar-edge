import path from "node:path";
import { baseConfig } from "@repo/vitest-config";
import { mergeConfig } from "vitest/config";

const alias = { "@": path.resolve(process.cwd(), "./src") };

export default mergeConfig(baseConfig, {
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          globals: true,
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: ["src/**/*.db.test.ts"],
          environmentMatchGlobs: [
            // Use jsdom for React component tests
            ["**/*.test.tsx", "jsdom"],
            // Use node for server actions and utilities
            ["**/*.test.ts", "node"],
          ],
          setupFiles: ["./src/test/setup.ts"],
        },
      },
      {
        resolve: { alias },
        test: {
          name: "db",
          globals: true,
          include: ["src/**/*.db.test.ts"],
          environment: "node",
          // DATABASE_URL is injected per-worker from db-global-setup.ts, which
          // starts a throwaway container. Never the developer's own database:
          // the harness truncates every table between tests.
          testTimeout: 20_000,
          // Every db test shares one database and truncates between tests,
          // so files must not run concurrently.
          fileParallelism: false,
          globalSetup: ["./src/test/db-global-setup.ts"],
          setupFiles: ["./src/test/db-setup.ts"],
        },
      },
    ],
  },
  resolve: { alias },
});
