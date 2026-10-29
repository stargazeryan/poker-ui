import { defineConfig } from "tsup";

/*
 * Two entry points, split by whether they are about money:
 *
 *   index    the core — table types, seats, cards, positioning. No game in it.
 *   wager    money on the table: chips, breakdowns, big blinds.
 *
 * Splitting them is the point: a card game with no betting imports `index` and
 * never pulls a chip set into its bundle.
 */
export default defineConfig({
  entry: {
    index: "src/index.ts",
    wager: "src/wager/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["react", "react-dom"],
  banner: { js: "\"use client\";" },
});
