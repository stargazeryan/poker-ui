import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  root: "demo",
  // GitHub Pages project sites are served under /<repo>/, so the workflow sets
  // PAGES_BASE=/poker-ui/. Locally this stays "/".
  base: process.env.PAGES_BASE ?? "/",
  plugins: [react(), tailwindcss()],
  build: { outDir: "dist", emptyOutDir: true },
});
