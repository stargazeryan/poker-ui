import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const pkgDir = fileURLToPath(new URL("..", import.meta.url));

/**
 * The docs site imports the package by its published name, never by a relative
 * path into `src`. Which artefact that name resolves to depends on the mode:
 *
 *   vite              -> src/index.ts   (HMR while writing docs)
 *   vite --mode dist  -> dist/index.js  (the packed library, built by tsup)
 *
 * GitHub Pages builds the docs with `--mode dist`, so the deployed site is
 * itself evidence that the published artefact works.
 */
const resolvePkg = (mode: string) => (mode === "dist" ? "dist/index.js" : "src/index.ts");
const resolveWager = (mode: string) => (mode === "dist" ? "dist/wager.js" : "src/wager/index.ts");

export default defineConfig(({ mode }) => ({
  root: "demo",
  // GitHub Pages project sites are served under /<repo>/, so the workflow sets
  // PAGES_BASE=/poker-ui/. Locally this stays "/".
  base: process.env.PAGES_BASE ?? "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      // exact match, so the subpath exports below still resolve on their own
      { find: /^@stargazeryan\/poker-ui$/, replacement: join(pkgDir, resolvePkg(mode)) },
      // mirrors the "./wager" entry in package.json's exports map
      { find: "@stargazeryan/poker-ui/wager", replacement: join(pkgDir, resolveWager(mode)) },
      // mirrors the "./styles.css" entry in package.json's exports map
      { find: "@stargazeryan/poker-ui/styles.css", replacement: join(pkgDir, "src/styles.css") },
    ],
  },
  build: { outDir: "dist", emptyOutDir: true },
}));
