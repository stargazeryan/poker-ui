import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/*
 * The docs app imports the package by its published name, exactly as a consumer
 * would. Aliasing it here (instead of installing the tarball) is what lets the
 * docs smoke test run in CI without a pack/install cycle.
 */
const pkgEntry = fileURLToPath(new URL("./src/index.ts", import.meta.url));
const wagerEntry = fileURLToPath(new URL("./src/wager/index.ts", import.meta.url));
const pkgStyles = fileURLToPath(new URL("./src/styles.css", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: "@stargazeryan/poker-ui/styles.css", replacement: pkgStyles },
      { find: "@stargazeryan/poker-ui/wager", replacement: wagerEntry },
      { find: /^@stargazeryan\/poker-ui$/, replacement: pkgEntry },
    ],
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    setupFiles: ["tests/setup.ts"],
    restoreMocks: true,
    coverage: {
      provider: "v8",
      /*
       * The library, and only the library.
       *
       * Measuring everything also counts the docs app and — once the site has
       * been built — `demo/dist/assets/*.js`, a bundle that scores 0% and moves
       * the total whenever somebody runs `npm run docs:build`. The number worth
       * gating is `src`, and gating it in the same run as `npm test` is what
       * stops a deleted test or an untested module from being invisible.
       */
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts"],
      reporter: ["text", "json-summary"],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
});
