import { defineConfig } from "vitest/config";

export const baseConfig = defineConfig({
  test: {
    coverage: {
      provider: "v8",
      all: true,
      reporter: [
        [
          "json",
          {
            file: "../coverage.json",
          },
        ] as const,
      ],
      enabled: true,
    },
  },
});
