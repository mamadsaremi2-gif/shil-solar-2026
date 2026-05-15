import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
    }),
  ],

  build: {
    target: "es2020",
    minify: "terser",
    sourcemap: false,
    chunkSizeWarningLimit: 2500,
  },

  server: {
    host: "0.0.0.0",
  },
});
