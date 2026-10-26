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

## Deciding the version

Under 0.x, semver treats the **middle** number as the breaking one, so that is
where anything a consumer could have to react to belongs — and for a UI library
that is a wider set than the TypeScript surface suggests:

| change | bump | why |
| --- | --- | --- |
| removed / renamed prop, export or export subpath | `0.(y+1).0` | their build breaks |
| a default changed so the render differs | `0.(y+1).0` | their output changes |
| a bug fix that moves pixels or changes markup | `0.(y+1).0` | anyone who compensated for the bug breaks — say so under Changed |
| raised peer range (React major, Tailwind major) | `0.(y+1).0` | their install breaks |
| renamed CSS custom property or utility class | `0.(y+1).0` | their CSS breaks |
| new component, prop, export or token | `0.(y+1).0` | additive is a minor, even in 0.x |
| docs, tests, internal refactor, packaging metadata | `0.y.(z+1)` | invisible to consumers |

The shortcut that follows: **if the CHANGELOG's Changed section is non-empty, bump
the middle number.** Most releases of this package will be minors, because most of
them either add something or move a pixel. Before 1.0 that is normal; what matters
is that the number reliably tells a consumer whether to read the migration notes.

Prereleases are the escape hatch for anything you cannot verify yourself:
`npm version preminor --preid rc` gives `0.7.0-rc.0`, and `npm publish --tag next`
publishes it without touching `latest`, so someone who can see the table can find
the layout bug before the number is immutable.

Reaching 1.0.0 is a promise rather than a milestone: it says removals now cost a
2.0. Worth doing when the prop surface has stopped moving for a release or two and
someone outside your control depends on it. Never is also a legitimate answer for
a package like this.

## Path A — publish from your own machine

The shortest safe route, and the one to use for the first release.

```bash
git switch main && git pull
npm ci --include=dev

# `npm version` makes the commit and the tag itself, so git needs an identity.
# Without one it dies with "Author identity unknown" *after* staging
# package.json and package-lock.json, which leaves the tree dirty and makes the
# retry fail with "Git working directory not clean" instead. Recover with
# `git restore --staged --worktree package.json package-lock.json`.
git config user.name  hermes
git config user.email hermes@noreply.github.com

npm version minor -m "release: v%s"   # 0.5.0 -> 0.6.0, commits and tags
git push --follow-tags                # npm version writes an ANNOTATED tag,
                                      # which is exactly what --follow-tags pushes

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
- **A failed `npm version` leaves a half-applied bump.** It stages
  `package.json` and `package-lock.json` before committing, so if the commit
  fails (no git identity, a failing commit hook) the tree is dirty and the next
  attempt refuses. Undo it with
  `git restore --staged --worktree package.json package-lock.json`.
- **Sourcemaps are 188 kB of the 352 kB tarball** (they embed the sources, so they
  are self-contained). Add a `.npmignore` containing `*.map` to halve the
  download — `npm run check:release` prints the number either way.
