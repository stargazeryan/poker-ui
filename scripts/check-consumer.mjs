/*
 * Consumer smoke test.
 *
 * The README's setup instructions are the package's most fragile surface: this
 * is a *compiled* package, so the consumer's Tailwind build only sees the class
 * names if they add `@source "<node_modules>/@stargazeryan/poker-ui"`, and the
 * design tokens only exist if they import `styles.css`. The repo's own demo
 * sidesteps both (it imports `../../src` directly), so nothing else verifies
 * the path real consumers take.
 *
 * This script packs the package, installs the tarball into a throwaway Vite +
 * Tailwind v4 app that follows the README literally, builds it, and asserts the
 * resulting CSS actually contains the utilities, tokens and keyframes the
 * components need.
 *
 * Usage: npm run test:consumer
 */

import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const work = mkdtempSync(join(tmpdir(), "poker-ui-consumer-"));
const app = join(work, "app");
const failures = [];
const notes = [];

const log = (msg) => console.log(`  ${msg}`);
const ok = (msg) => console.log(`  \u001b[32m✓\u001b[0m ${msg}`);
const fail = (msg) => {
  failures.push(msg);
  console.log(`  \u001b[31m✗\u001b[0m ${msg}`);
};

function run(cmd, args, cwd, extraEnv = {}) {
  const res = spawnSync(cmd, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, ...extraEnv },
  });
  if (res.status !== 0) {
    throw new Error(
      `${cmd} ${args.join(" ")} failed (${res.status}) in ${cwd}\n--- stdout ---\n${res.stdout ?? ""}\n--- stderr ---\n${
        res.stderr ?? ""
      }`,
    );
  }
  return res.stdout ?? "";
}

const bin = (name) => join(app, "node_modules", ".bin", process.platform === "win32" ? `${name}.cmd` : name);

try {
  console.log("packing @stargazeryan/poker-ui…");
  const packOut = run("npm", ["pack", "--pack-destination", work], repo);
  const tarball = join(work, packOut.trim().split("\n").pop().trim());
  if (!existsSync(tarball)) throw new Error(`npm pack produced no tarball (${packOut})`);
  log(`tarball: ${tarball}`);

  mkdirSync(join(app, "src"), { recursive: true });

  writeFileSync(
    join(app, "package.json"),
    JSON.stringify(
      {
        name: "poker-ui-consumer-smoke",
        private: true,
        type: "module",
        scripts: { build: "vite build" },
      },
      null,
      2,
    ),
  );

  writeFileSync(
    join(app, "index.html"),
    `<!doctype html><html><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`,
  );

  // app.css — copied from the README's "Setup (Tailwind v4)" section verbatim,
  // plus a token override to prove theming works.
  writeFileSync(
    join(app, "src", "app.css"),
    `@import "tailwindcss";
@source "../node_modules/@stargazeryan/poker-ui";
@import "@stargazeryan/poker-ui/styles.css";

@theme {
  --color-felt: #123456;
}
`,
  );

  writeFileSync(
    join(app, "src", "main.tsx"),
    `import { createRoot } from "react-dom/client";
import { CardTable, Seat, Pot, HoleCards, CommunityCards, PlayingCard, CardBack } from "@stargazeryan/poker-ui";
import "./app.css";

createRoot(document.getElementById("root")!).render(
  <div>
    <CardTable
      seatCount={6}
      yourTurn
      winnerSeats={[0]}
      yourSeatIndex={0}
      renderSeat={(i, isYou, box) => (
        <Seat width={box.width} height={box.height} isActive={isYou} header={<b>{isYou ? "you" : i}</b>}>
          <HoleCards cards={["As", "Kh"]} size="sm" />
        </Seat>
      )}
      renderBet={(i) => (i === 0 ? <CardBack size="xs" /> : null)}
      center={
        <div>
          <CommunityCards cards={["Ah", "Kd", "7c"]} size="md" />
          <Pot label="Main" amount={240} />
          <PlayingCard card="Qc" size="lg" />
        </div>
      }
    />
  </div>,
);
`,
  );

  writeFileSync(
    join(app, "vite.config.ts"),
    `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({ plugins: [react(), tailwindcss()], build: { outDir: "dist" } });
`,
  );

  console.log("installing the consumer app…");
  run(
    "npm",
    [
      "install",
      "--no-audit",
      "--no-fund",
      tarball,
      "react@19",
      "react-dom@19",
      "vite@6",
      "@vitejs/plugin-react@4",
      "tailwindcss@4",
      "@tailwindcss/vite@4",
    ],
    app,
  );

  console.log("building the consumer app…");
  run(bin("vite"), ["build"], app, { NODE_ENV: "production" });

  const assets = join(app, "dist", "assets");
  const cssFile = readdirSync(assets).find((f) => f.endsWith(".css"));
  if (!cssFile) throw new Error(`no CSS emitted in ${assets}: ${readdirSync(assets).join(", ")}`);
  const css = readFileSync(join(assets, cssFile), "utf8");
  const jsFile = readdirSync(assets).find((f) => f.endsWith(".js"));
  const js = jsFile ? readFileSync(join(assets, jsFile), "utf8") : "";

  console.log(`\nasserting on ${cssFile} (${(css.length / 1024).toFixed(1)} kB)\n`);

  // Utilities only exist if the consumer's @source directive reached the package.
  const utilities = [
    [".animate-turn-glow", /\.animate-turn-glow\s*{/],
    [".animate-deal-in", /\.animate-deal-in\s*{/],
    [".animate-card-flip", /\.animate-card-flip\s*{/],
    [".animate-confetti", /\.animate-confetti\s*{/],
    [".animate-felt-shimmer", /\.animate-felt-shimmer\s*{/],
    [".animate-spotlight", /\.animate-spotlight\s*{/],
    [".border-gold", /\.border-gold\s*{/],
    [".text-gold", /\.text-gold\s*{/],
    [".from-rail", /\.from-rail\s*{/],
    [".via-rail-dark", /\.via-rail-dark\s*{/],
    [".to-rail-deep", /\.to-rail-deep\s*{/],
    [".w-8.h-11 (card size)", /\.h-11\s*{/],
    // ChipStack is the only thing referencing the chip palette, so these prove
    // the tokens reach a consumer's CSS rather than the consumer emitting them
    // themselves.
    [".fill-chip-black", /\.fill-chip-black\s*{/],
    [".fill-chip-blue", /\.fill-chip-blue\s*{/],
  ];
  for (const [label, re] of utilities) {
    (re.test(css) ? ok : fail)(`utility present: ${label}`);
  }

  // Keyframes: emitted on demand, and only when used.
  const keyframes = [
    ["turn-glow", true],
    ["winner-glow", true],
    ["deal-in", true],
    ["card-flip", true],
    ["felt-shimmer", true],
    ["spotlight-breathe", true],
    ["confetti", true],
    ["card-deal (removed as dead)", false],
    ["bubble-pop (removed as dead)", false],
  ];
  for (const [name, expected] of keyframes) {
    const present = css.includes(`@keyframes ${name}`);
    present === expected
      ? ok(`@keyframes ${name} ${expected ? "emitted" : "correctly tree-shaken"}`)
      : fail(`@keyframes ${name} ${present ? "should not be" : "should be"} in the output`);
  }

  // The consumer's own @theme override must win for the token the felt uses.
  const feltOverride = /--color-felt:\s*#123456/.test(css);
  feltOverride ? ok("consumer @theme override of --color-felt is emitted") : fail("consumer --color-felt override missing");
  const packageTokens = [
    "--color-felt-light",
    "--color-felt-dark",
    "--color-rail",
    "--color-gold",
    "--color-card-back",
    "--color-chip-red",
    "--color-chip-black",
    "--color-chip-blue",
    // removed as dead: nothing in the package or the docs referenced them
    "--color-wood",
  ];
  const mustBeAbsent = new Set(["--color-wood"]);
  for (const token of packageTokens) {
    const present = css.includes(`${token}:`);
    if (mustBeAbsent.has(token)) {
      present ? fail(`token should be gone but is still emitted: ${token}`) : ok(`dead token still gone: ${token}`);
    } else {
      present ? ok(`token referenced by the components is emitted: ${token}`) : fail(`token missing: ${token}`);
    }
  }

  /*
   * The reduced-motion block must not reach into the host app's animations.
   * Both the pattern and the brace matching have to tolerate minification:
   * Lightning CSS turns the query into `@media(prefers-reduced-motion:reduce)`.
   */
  const rmAt = css.search(/@media\s*\(\s*prefers-reduced-motion/);
  if (rmAt === -1) {
    fail("reduced-motion block is missing from the output entirely");
  } else {
    let depth = 0;
    let end = css.length;
    for (let i = css.indexOf("{", rmAt); i < css.length; i++) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
    const rmBlock = css.slice(rmAt, end);
    if (/\*\s*[,{]/.test(rmBlock)) {
      fail("reduced-motion rule uses a universal selector, which would disable the host app's animations");
    } else if (!rmBlock.includes(".animate-turn-glow")) {
      fail("reduced-motion rule does not name this package's own animations");
    } else {
      ok("reduced-motion rule is scoped to the library's own animations");
    }
  }

  // Sanity: an unbuilt/unresolved import would leave the library out of the bundle.
  js.includes("animate-turn-glow") && js.includes("betting-line")
    ? ok("package code is in the consumer bundle")
    : fail("package code missing from the consumer bundle");

  notes.push(`build artefacts: ${assets}`);
} catch (error) {
  fail(`consumer smoke test threw: ${error instanceof Error ? error.message : String(error)}`);
} finally {
  if (!process.env.KEEP_CONSUMER) rmSync(work, { recursive: true, force: true });
  else console.log(`\nkept: ${work}`);
}

if (failures.length) {
  console.error(`\n\u001b[31mconsumer smoke test FAILED (${failures.length}):\u001b[0m`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("\n\u001b[32mconsumer smoke test passed — the README's setup works.\u001b[0m");
for (const n of notes) console.log(`  ${n}`);
