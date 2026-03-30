// @ts-check

import react from "@astrojs/react";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  base: "/polar-edge/juice",
  integrations: [react()],
  vite: {
    css: {
      postcss: {
        plugins: [(await import("@tailwindcss/postcss")).default],
      },
    },
  },
});
