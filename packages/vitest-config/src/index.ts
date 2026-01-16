import { defineConfig } from "vitest/config";
import { baseConfig } from "./configs/base-config";

export const sharedConfig = defineConfig({
  test: {
    globals: true,
    ...baseConfig.test,
  },
});

export { baseConfig } from "./configs/base-config";
export { uiConfig } from "./configs/ui-config";
