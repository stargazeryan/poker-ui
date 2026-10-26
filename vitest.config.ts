import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/*
 * The docs app imports the package by its published name, exactly as a consumer
 * would. Aliasing it here (instead of installing the tarball) is what lets the
 * docs smoke test run in CI without a pack/install cycle.
 */
const pkgEntry = fileURLToPath(new URL("./src/index.ts", import.meta.url));
const pkgStyles = fileURLToPath(new URL("./src/styles.css", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: "@stargazeryan/poker-ui/styles.css", replacement: pkgStyles },
      { find: /^@stargazeryan\/poker-ui$/, replacement: pkgEntry },
    ],
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    setupFiles: ["tests/setup.ts"],
    restoreMocks: true,
  },
});
