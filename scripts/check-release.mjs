/*
 * Release gate.
 *
 * Run before `npm publish`. Two jobs:
 *
 *  1. The git tag and package.json must agree. Publishing 0.6.0 from a v0.5.0 tag
 *     is the kind of mistake you only notice afterwards, when the version is
 *     immutable.
 *  2. The tarball must contain what we think it does — the built entry points and
 *     the stylesheet, and none of the repo's own test/demo/script files. `files`
 *     in package.json is meant to guarantee this; this checks the guarantee.
 *
 * Usage: node scripts/check-release.mjs [tag-or-version]
 */

import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const ok = (msg) => console.log(`  \u001b[32m✓\u001b[0m ${msg}`);
const fail = (msg) => {
  failures.push(msg);
  console.log(`  \u001b[31m✗\u001b[0m ${msg}`);
};

const pkg = JSON.parse(readFileSync(resolve(repo, "package.json"), "utf8"));
const requested = process.argv[2];

console.log(`checking ${pkg.name}@${pkg.version}\n`);

// ---- tag vs version ----
if (requested) {
  const cleaned = requested.replace(/^v/, "");
  cleaned === pkg.version
    ? ok(`tag ${requested} matches package.json ${pkg.version}`)
    : fail(`tag ${requested} does not match package.json ${pkg.version}`);
} else {
  console.log("  (no tag given, skipping the tag check)");
}

// ---- must not be a version that already exists ----
const published = spawnSync("npm", ["view", `${pkg.name}@${pkg.version}`, "version"], {
  cwd: repo,
  encoding: "utf8",
});
if (published.stdout.trim() === pkg.version) {
  fail(`${pkg.version} is already published — bump the version (npm version minor)`);
} else {
  ok(`${pkg.version} is not published yet`);
}

// ---- the tarball ----
const pack = spawnSync("npm", ["pack", "--dry-run", "--json"], { cwd: repo, encoding: "utf8" });
if (pack.status !== 0) {
  fail(`npm pack --dry-run failed: ${pack.stderr.trim()}`);
} else {
  // npm 7-11 return an array; npm 12+ returns an object keyed by package name.
  const parsed = JSON.parse(pack.stdout);
  const info = Array.isArray(parsed) ? parsed[0] : Object.values(parsed)[0];
  if (!info || !Array.isArray(info.files)) {
    fail(`could not read the file list out of npm pack --json (keys: ${Object.keys(parsed).join(", ")})`);
  }
  const paths = (info?.files ?? []).map((f) => f.path);
  const has = (p) => paths.includes(p);

  const required = ["dist/index.js", "dist/index.cjs", "dist/index.d.ts", "dist/index.d.cts", "src/styles.css", "README.md", "LICENSE"];
  for (const file of required) {
    has(file) ? ok(`tarball contains ${file}`) : fail(`tarball is missing ${file}`);
  }

  const leaked = paths.filter((p) => /^(tests|demo|scripts|\.github)\//.test(p) || p.endsWith(".test.tsx"));
  leaked.length === 0
    ? ok(`nothing from tests/ demo/ scripts/ leaked in (${paths.length} files)`)
    : fail(`tarball leaked: ${leaked.join(", ")}`);

  const maps = (info?.files ?? []).filter((f) => f.path.endsWith(".map"));
  const mapBytes = maps.reduce((sum, f) => sum + f.size, 0);
  console.log(
    `  \u001b[2m${maps.length} sourcemap(s), ${(mapBytes / 1024).toFixed(0)}kB of ${((info?.unpackedSize ?? 0) / 1024).toFixed(0)}kB unpacked — add "*.map" to a .npmignore to drop them\u001b[0m`,
  );
}

if (failures.length) {
  console.error(`\n\u001b[31mrelease check FAILED (${failures.length}):\u001b[0m`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("\n\u001b[32mrelease check passed.\u001b[0m");
