# Changelog

## 1.2.0

### Minor Changes

- e7e3cb5: add item in Github menu dropdown to copy permalink as a markdown link

## 1.1.1

### Patch Changes

- 368615d: rename to GiveMeALink
- 1847acc: adding logo

## 1.1.0

### Minor Changes

- 069cff5: support dynamic output and settings to control it

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- TypeScript sources under `src/` with strict `tsconfig.json`. `@types/chrome` and `@types/bun` provide platform types.
- `scripts/build.ts` bundles each entry point into a self-contained IIFE under `dist/extension/` using `Bun.build`.
- Development tooling: Bun (runtime + package manager + test runner), oxlint, oxfmt, EditorConfig, `.gitignore`.
- Unit tests for `formatLink` and `clampDuration` using `bun:test`.
- `bun run package` builds, then produces a versioned zip in `dist/` for store submission.
- GitHub Actions CI (Bun-based): lint, format check, typecheck, tests, and zip artifact on every push and PR.
- MIT `LICENSE`.

### Changed

- Source layout moved from root-level `.js` files to `src/**/*.ts`. The `lib/format.js` cross-browser
  shim is gone — `Bun.build` inlines the helpers into each entry's bundle.
- `manifest.json` `background.scripts` no longer references `lib/format.js`; `options.html` no longer
  loads it as a separate `<script>`.
- Unpacked install now points at `dist/extension/`, which is produced by `bun run build`.

## [1.0.0] - 2026-05-12

### Added

- Initial release. Keyboard shortcut copies the current page URL as a Markdown link,
  with configurable label format and an optional confirmation toast.
