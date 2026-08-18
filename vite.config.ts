import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import type { Plugin } from "vite";
import { defineConfig } from "vite";

/** Dev-only: direct visits to /dashboard/applications etc. must serve the SPA shell. */
function spaFallbackPlugin(htmlPath = "/index.vite.html"): Plugin {
  return {
    name: "biazo-spa-fallback",
    configureServer(server) {
      return () => {
        server.middlewares.use((req, _res, next) => {
          const url = (req.url ?? "").split("?")[0]!;
          if (req.method !== "GET" && req.method !== "HEAD") return next();
          if (
            url.startsWith("/@") ||
            url.startsWith("/node_modules") ||
            url.startsWith("/src/") ||
            url.startsWith("/assets/") ||
            url.startsWith("/api/") ||
            /\.\w+$/.test(url)
          ) {
            return next();
          }
          if (url !== "/" && url !== htmlPath) {
            req.url = htmlPath;
          }
          next();
        });
      };
    },
  };
}

export default defineConfig({
  appType: "spa",
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  plugins: [
    tailwindcss(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    viteReact(),
    spaFallbackPlugin(),
  ],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, "index.vite.html"),
      },
    },
  },
});
