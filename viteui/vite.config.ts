import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    cloudflare(),
    visualizer({
      filename: "stats.html",
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    target: 'es2015' // Add this line to ensure async/await is transpiled
  },
  resolve: {
    alias: {
      react: 'react',
      'react-dom': 'react-dom',
    },
  },
});
