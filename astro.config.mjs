import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import cloudflare from "@astrojs/cloudflare";
import { defineConfig } from "astro/config";

export default defineConfig({
  integrations: [react(), tailwind()],
  output: "server",
  adapter: cloudflare({ imageService: "compile" }),
  vite: {
    build: {
      chunkSizeWarningLimit: 1600,
    },
  },
});
