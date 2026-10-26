# Releasing

The package is `@stargazeryan/poker-ui` on the public npm registry. Version
bumps are manual; publishing is either a command you run or a tag you push.

## Before anything

`npm publish` refuses to overwrite a published version, so **the version must be
bumped**. For 0.x, semver treats the middle number as the breaking one — this
branch changes `Pot`'s default formatting and stops clamping `seatCount`, so it
goes to **0.6.0**, not 0.6.1.

`dist/` is gitignored. Never publish without building: `prepublishOnly` runs the
type check, the tests and `npm run build`, so `npm publish` cannot ship a stale or
broken tarball. Run `npm run check:release vX.Y.Z` to check the tag against
`package.json` and inspect exactly what would be uploaded.

## Path A — publish from your own machine

The shortest safe route, and the one to use for the first release.

```bash
git switch main && git pull
npm ci --include=dev

npm version minor          # 0.5.0 -> 0.6.0, commits and tags
git push --follow-tags

npm login                  # interactive: your credentials, never through chat
npm run check:release v0.6.0
npm publish                # prepublishOnly = typecheck && test && build
```

Then verify what the registry actually has:

```bash
npm view @stargazeryan/poker-ui version
npm view @stargazeryan/poker-ui dist.integrity
```

and, in a scratch directory, install the published artefact and build it — the
same path `npm run test:consumer` exercises locally:

```bash
mkdir /tmp/try && cd /tmp/try && npm init -y
npm i @stargazeryan/poker-ui@0.6.0 react react-dom vite @vitejs/plugin-react tailwindcss @tailwindcss/vite
# then follow the README's three-line Tailwind setup and build
```

## Path B — publish from CI, with provenance (recommended once it works)

`.github/workflows/release.yml` publishes on a `v*` tag using npm's **trusted
publishing**: GitHub mints a short-lived OIDC token for this exact repo and
workflow, so there is no npm token stored anywhere. Provenance is attached, which
is what puts the "Built and signed on GitHub Actions" line on the package page.

```bash
npm version minor
git push --follow-tags     # the tag triggers the workflow
```

One-time setup on npmjs.com: the package's **Settings → Trusted Publisher**,
pointing at repository `stargazeryan/poker-ui` and workflow `release.yml`.

> I could not reach npm's documentation from the sandbox this was written in
> (the proxy refused), so the exact field names and the npm CLI version floor
> (`>= 11.5.1`; the workflow uses Node 24 for that reason) are from memory —
> confirm them at `docs.npmjs.com/trusted-publishers` before relying on it. A
> `workflow_dispatch` run of the same workflow is a dress rehearsal: it gates and
> checks everything and publishes nothing.

## Traps

- **Never put an npm token in a chat message, an env var in a workflow file, or
  an inline command.** `npm login` is interactive; CI uses OIDC. A token pasted
  somewhere it is logged should be revoked at `npmjs.com/settings/<user>/tokens`
  immediately.
- **Do not add `"provenance": true` to `publishConfig`.** Provenance needs the
  OIDC environment, so it would make a local `npm publish` fail. The workflow
  passes `--provenance` explicitly for exactly that reason.
- **Unpublishing is heavily restricted** (within 72 hours, no dependents), so a
  bad release is normally fixed by deprecating and publishing a patch:
  `npm deprecate @stargazeryan/poker-ui@0.6.0 "broken, use 0.6.1"`.
- **The two GitHub workflows are independent.** `ci.yml` runs on every push,
  `pages.yml` deploys the docs on `main`, `release.yml` publishes on a tag.
- **Sourcemaps are 188 kB of the 352 kB tarball** (they embed the sources, so they
  are self-contained). Add a `.npmignore` containing `*.map` to halve the
  download — `npm run check:release` prints the number either way.
