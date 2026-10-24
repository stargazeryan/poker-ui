/*
 * Builds the docs site.
 *
 * Uses Vite's JS API rather than the `vite build` CLI: the CLI is a long-lived
 * process in some sandboxes and CI images (it can sit waiting on stdin and never
 * exit), while the programmatic build always returns.
 *
 * Usage: node scripts/build-docs.mjs [mode]      # mode defaults to "dist"
 */

import process from "node:process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const mode = process.argv[2] ?? "dist";

process.chdir(repo);

const { build } = await import("vite");
await build({ configFile: resolve(repo, "demo/vite.config.ts"), mode });
console.log(`docs built (mode=${mode})`);
