# GiveMeALink — Copy as Markdown Link

Tiny cross-browser extension. Press the shortcut on any page and your clipboard gets a Markdown link like:

```
[github.com/ducduyn31](https://github.com/ducduyn31/give-me-a-link/issues/12?tab=open)
```

## Shortcut

- macOS: `Cmd+.`
- Windows / Linux: `Ctrl+.`

Rebind it at `chrome://extensions/shortcuts` (Chrome) or `about:addons` → cog ⚙ → "Manage Extension Shortcuts" (Firefox).

You can also click the extension's toolbar button to copy — handy in browsers like **Arc** that don't deliver extension keyboard shortcuts. Pin the extension to the toolbar first (Arc hides extension buttons by default), then click it on any page.

## Install (unpacked)

Build the extension first so the browser has plain JavaScript to load:

```sh
bun install
bun run build
```

The build emits two unpacked extensions: `dist/extension/` for Chrome and `dist/extension-firefox/` for Firefox. They share identical JS; only the manifest differs (Firefox doesn't support the `offscreen` permission, so it's stripped from that build).

### Chrome

1. Open `chrome://extensions`.
2. Toggle **Developer mode** (top right).
3. Click **Load unpacked** and pick `dist/extension/`.

### Firefox

1. Open `about:debugging`.
2. Click **This Firefox** → **Load Temporary Add-on…**.
3. Pick `dist/extension-firefox/manifest.json`.

Firefox unloads temporary add-ons on browser restart; reload via the same dialog.

## Options

From the extensions page, open the extension's **Options** / **Preferences**:

- **Clipboard template** — a string that defines the entire text written to the clipboard. The options page renders a live preview as you type. Default: `[{host}/{path[0]}]({url})`. Available tokens:
  - `{host}` — hostname with leading `www.` stripped (e.g. `github.com`).
  - `{path}` — full pathname with leading slash (e.g. `/ducduyn31/give-me-a-link/issues/12`).
  - `{path[N]}` — the Nth non-empty path segment, 0-indexed (e.g. `{path[0]}` → `ducduyn31`). Out-of-range indices render as empty.
  - `{url}` — full original URL, including query string and hash.
  - `{title}` — current tab title.
  - `{hash}` — URL fragment without the leading `#` (e.g. `comment-3` from `#comment-3`). Empty if no fragment.
  - `{query}` — full query string without the leading `?` (e.g. `tab=open` from `?tab=open`). Empty if no query string.
  - `{query:name}` — value of a specific query parameter by name (e.g. `{query:tab}` → `open`). Empty if the parameter is absent.
  - Unknown `{tokens}` are left literal so typos are visible. An empty template falls back to the default.

  Examples against `https://github.com/ducduyn31/give-me-a-link/issues/12?tab=open#comment-3`:

  | Template                              | Result                                                                                                                      |
  | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
  | `[{host}/{path[0]}]({url})` (default) | `[github.com/ducduyn31](https://github.com/ducduyn31/give-me-a-link/issues/12?tab=open#comment-3)`                          |
  | `[{host}{path}]({url})`               | `[github.com/ducduyn31/give-me-a-link/issues/12](https://github.com/ducduyn31/give-me-a-link/issues/12?tab=open#comment-3)` |
  | `[{host}]({url})`                     | `[github.com](https://github.com/ducduyn31/give-me-a-link/issues/12?tab=open#comment-3)`                                    |
  | `{title} — {url}`                     | `Issue 12 · ducduyn31/give-me-a-link — https://github.com/ducduyn31/give-me-a-link/issues/12?tab=open#comment-3`            |
  | `[{host}/{path[2]}#{hash}]({url})`    | `[github.com/issues#comment-3](https://github.com/ducduyn31/give-me-a-link/issues/12?tab=open#comment-3)`                   |
  | `[{host}?{query}]({url})`             | `[github.com?tab=open](https://github.com/ducduyn31/give-me-a-link/issues/12?tab=open#comment-3)`                           |
  | `[{host} ({query:tab})]({url})`       | `[github.com (open)](https://github.com/ducduyn31/give-me-a-link/issues/12?tab=open#comment-3)`                             |

- **Toast** — show a small confirmation toast in the current page after copy. On by default. Duration in milliseconds, 200–10000.

Hard-coded behaviors:

- A leading `www.` is always stripped from `{host}`.

## Privacy

GiveMeALink runs entirely locally. It does not collect, transmit, or store any data on remote servers.

- Reads the current tab's URL and title only at the moment you press the configured shortcut — never in the background.
- Persists your settings (template, toast preferences) via `chrome.storage`, which lives on your device.
- Makes no network requests. No analytics, no telemetry, no remote code.

The `activeTab` and `scripting` permissions exist solely to inject the success toast into the page after a copy; the injected code does not read page content. The Chrome build also requests `offscreen` (used to perform the clipboard write from an extension page so it works even when DevTools or the omnibox has focus). The Firefox build instead requests `clipboardWrite` for the same reason — Firefox doesn't implement the offscreen API.

## Development

Requires [Bun](https://bun.com) 1.2+.

```sh
bun install
bun run lint        # oxlint
bun run format      # oxfmt (use format:check in CI)
bun run typecheck   # tsc --noEmit (configured via tsconfig.json)
bun test            # bun's built-in test runner
bun run build       # bundles src/ into dist/extension/ (Chrome) and dist/extension-firefox/
bun run package     # builds, then zips both targets into dist/<name>-<version>.zip and dist/<name>-<version>-firefox.zip
```

`bun run verify` runs lint, format check, typecheck, and tests in one shot. CI runs the same on every push and PR and uploads the packaged zip as an artifact (see `.github/workflows/ci.yml`).

### Layout

- `src/background.ts` — service-worker entry; registers the keyboard command and injects the toast.
- `src/options.ts` — options-page script.
- `src/lib/format.ts` — pure helpers (`formatLink`, `clampDuration`) shared between both entries and the tests.
- `manifest.json` / `options.html` — static assets at the repo root; copied verbatim into `dist/extension/` by the build.
- `test/` — unit tests using `bun:test`.
- `scripts/build.ts` — `Bun.build` bundler invocation. Emits self-contained IIFE files for `background.js` and `options.js` so they load both as a Chrome MV3 service worker and a Firefox MV3 event page. Produces two output dirs: `dist/extension/` (Chrome) and `dist/extension-firefox/` (Firefox manifest with the `offscreen` permission stripped).
- `scripts/package.ts` — runs the build, then zips each output dir into `dist/<name>-<version>.zip` (Chrome) and `dist/<name>-<version>-firefox.zip`. Fails if either `manifest.json` and `package.json` versions disagree.

### Releasing

Releases are driven by [Changesets](https://github.com/changesets/changesets) and the `.github/workflows/release.yml` workflow.

On every change that should ship to users:

1. `bun run changeset` and follow the prompts. This writes a markdown file under `.changeset/`.
2. Commit the changeset file alongside your code change and open a PR.

Once merged into `main`:

1. The Release workflow runs `changesets/action`, which opens (or updates) a `chore: release` PR. That PR bumps `package.json`, syncs `manifest.json` via `scripts/sync-manifest-version.ts`, and rolls the changeset entries into `CHANGELOG.md`.
2. Merge the release PR. The same workflow re-runs, sees the version is fresh, and executes `bun run release` — which builds, zips, uploads the Chrome zip to the Chrome Web Store, signs + submits the Firefox build to AMO, and creates a GitHub release with both zips attached.

## Known limitations

- Does not work on pages where extensions can't run scripts: `chrome://`, `about:`, the Chrome Web Store, `view-source:`, and the built-in PDF viewer. The shortcut silently does nothing on those.
- The toast uses inline styles. If a site's CSS bleeds in and breaks readability, swap the host `<div>` for one with an attached Shadow Root in `src/background.ts` → `copyAndToast`.
