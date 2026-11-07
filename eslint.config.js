import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

/*
 * Lint config, flat, and deliberately short.
 *
 * What it is here for is the class of mistake this package has actually made —
 * not style. The two `react-hooks` rules are the headline: 0.9.0's `DealerTable`
 * needed a memoised layout, and a `useMemo` written inside `FitBox`'s children
 * callback would have been a hook in a callback, which compiles, works until it
 * does not, and is exactly what `rules-of-hooks` refuses. Everything else is
 * `typescript-eslint`'s recommended set plus the small habits that keep a
 * library's public surface honest.
 *
 * Formatting is *not* decided here. Prettier was measured against this tree and
 * asked for 1,300+ changed lines across half the repository — mostly it un-picks
 * the hand-laid-out rows in `demo/src/docs` — so line breaking stays a human
 * decision, and `.editorconfig` carries the parts that are mechanical.
 */
export default tseslint.config(
  { ignores: ["dist/**", "demo/dist/**", "node_modules/**"] },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.mjs", "**/*.cjs"],
    plugins: { "react-hooks": reactHooks },
    languageOptions: {
      // Both: a component library's sources run in a browser, and its scripts
      // and tests run in node.
      globals: { ...globals.browser, ...globals.node },
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      // A nudge rather than a gate: several dependency lists here are
      // deliberately narrower than the linter would write them (the memoised
      // layout reads the numbers it uses, not the object they came from).
      "react-hooks/exhaustive-deps": "warn",

      // Habits, kept small on purpose.
      "no-debugger": "error",
      "no-var": "error",
      "prefer-const": "error",
      "no-duplicate-imports": "error",

      // The scripts in `scripts/` are short CLI helpers and lean on
      // `cond && push(...)` throughout; the alternative is rewriting working
      // release tooling to satisfy a lint rule, which is the wrong trade. The
      // rule still catches `a === b;` and `i++;` left behind.
      "@typescript-eslint/no-unused-expressions": [
        "error",
        { allowShortCircuit: true, allowTernary: true },
      ],
      // `interface RoundTableProps extends Omit<CardTableProps, ...> {}` is
      // empty on purpose, and load-bearing: `tests/docs-api.test.ts` reads the
      // *interface declaration* to keep the documented prop table honest, so
      // these two cannot become plain type aliases without losing that check.
      "@typescript-eslint/no-empty-object-type": ["error", { allowInterfaces: "with-single-extends" }],

      // An `any` in a typed library is a hole in the API; an `_`-prefixed
      // parameter is someone saying "this signature has to be here".
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
);
