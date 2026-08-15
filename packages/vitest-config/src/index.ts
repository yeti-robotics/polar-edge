import { defineConfig } from "vitest/config";
import { baseConfig } from "./configs/base-config.ts";

export const sharedConfig = defineConfig({
  test: {
    globals: true,
    ...baseConfig.test,
  },
});

export { baseConfig } from "./configs/base-config.ts";
export { uiConfig } from "./configs/ui-config.ts";
