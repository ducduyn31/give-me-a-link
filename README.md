# URL → Markdown Link

Tiny cross-browser extension. Press the shortcut on any page and your clipboard gets a Markdown link like:

```
[github.com/anthropics](https://github.com/anthropics/claude-code/issues/123?tab=open)
```

## Shortcut

- macOS: `Cmd+.`
- Windows / Linux: `Ctrl+.`

Rebind it at `chrome://extensions/shortcuts` (Chrome) or `about:addons` → cog ⚙ → "Manage Extension Shortcuts" (Firefox).

## Install (unpacked)

Build the extension first so the browser has plain JavaScript to load:

```sh
bun install
bun run build
```

The unpacked extension is then in `dist/extension/`.

### Chrome

1. Open `chrome://extensions`.
2. Toggle **Developer mode** (top right).
3. Click **Load unpacked** and pick `dist/extension/`.

### Firefox

1. Open `about:debugging`.
2. Click **This Firefox** → **Load Temporary Add-on…**.
3. Pick `dist/extension/manifest.json`.

Firefox unloads temporary add-ons on browser restart; reload via the same dialog.

## Options

From the extensions page, open the extension's **Options** / **Preferences**:

- **Label format** — what goes inside the `[...]`:
  - `host` — e.g. `github.com`
  - `host + first segment` — e.g. `github.com/anthropics` (default)
  - `host + full path` — e.g. `github.com/anthropics/claude-code/issues/123`
- **Toast** — show a small confirmation toast in the current page after copy. On by default. Duration in milliseconds, 200–10000.

Hard-coded behaviors:

- A leading `www.` is always stripped from the host.
- The URL in `(...)` always includes the query string and hash.

## Development

Requires [Bun](https://bun.com) 1.2+.

```sh
bun install
bun run lint        # oxlint
bun run format      # oxfmt (use format:check in CI)
bun run typecheck   # tsc --noEmit (configured via tsconfig.json)
bun test            # bun's built-in test runner
bun run build       # bundles src/ into dist/extension/
bun run package     # builds, then zips into dist/url-md-link-<version>.zip
```

`bun run verify` runs lint, format check, typecheck, and tests in one shot. CI runs the same on every push and PR and uploads the packaged zip as an artifact (see `.github/workflows/ci.yml`).

### Layout

- `src/background.ts` — service-worker entry; registers the keyboard command and injects the toast.
- `src/options.ts` — options-page script.
- `src/lib/format.ts` — pure helpers (`formatLink`, `clampDuration`) shared between both entries and the tests.
- `manifest.json` / `options.html` — static assets at the repo root; copied verbatim into `dist/extension/` by the build.
- `test/` — unit tests using `bun:test`.
- `scripts/build.ts` — `Bun.build` bundler invocation. Emits self-contained IIFE files for `background.js` and `options.js` so they load both as a Chrome MV3 service worker and a Firefox MV3 event page.
- `scripts/package.ts` — runs the build, then zips `dist/extension/` into `dist/<name>-<version>.zip`. Fails if `manifest.json` and `package.json` versions disagree.

### Releasing

Releases are driven by [Changesets](https://github.com/changesets/changesets) and the `.github/workflows/release.yml` workflow.

On every change that should ship to users:

1. `bun run changeset` and follow the prompts. This writes a markdown file under `.changeset/`.
2. Commit the changeset file alongside your code change and open a PR.

Once merged into `main`:

1. The Release workflow runs `changesets/action`, which opens (or updates) a `chore: release` PR. That PR bumps `package.json`, syncs `manifest.json` via `scripts/sync-manifest-version.ts`, and rolls the changeset entries into `CHANGELOG.md`.
2. Merge the release PR. The same workflow re-runs, sees the version is fresh, and executes `bun run release` — which builds, zips, uploads to the Chrome Web Store, signs + submits to Firefox AMO, and creates a GitHub release with the zip attached.

#### Required GitHub secrets

Configure these under **Settings → Secrets and variables → Actions**. Each upload step is skipped if its secrets are missing, so you can wire up Chrome first and add Firefox later.

Chrome Web Store (see [chrome-webstore-upload-cli docs](https://github.com/fregante/chrome-webstore-upload-cli#authentication) for how to mint the OAuth credentials):

- `CHROME_EXTENSION_ID`
- `CHROME_CLIENT_ID`
- `CHROME_CLIENT_SECRET`
- `CHROME_REFRESH_TOKEN`

Firefox AMO (create an API key at <https://addons.mozilla.org/developers/addon/api/key/>):

- `FIREFOX_JWT_ISSUER`
- `FIREFOX_JWT_SECRET`

The default `GITHUB_TOKEN` is sufficient for creating the GitHub release and the version PR.

> Workflows do not re-trigger on commits made by `GITHUB_TOKEN`, so the CI checks won't run on the release PR. If you want them to, set `GITHUB_TOKEN` to a PAT or app token in the workflow.

## Known limitations

- Does not work on pages where extensions can't run scripts: `chrome://`, `about:`, the Chrome Web Store, `view-source:`, and the built-in PDF viewer. The shortcut silently does nothing on those.
- The toast uses inline styles. If a site's CSS bleeds in and breaks readability, swap the host `<div>` for one with an attached Shadow Root in `src/background.ts` → `copyAndToast`.
