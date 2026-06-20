#!/usr/bin/env bun
// Bundles src/app/background.ts, src/app/content/github-menu.ts,
// src/app/offscreen.ts, and src/settings/options.ts into dist/extension/ as
// self-contained IIFE files, then copies static assets (manifest, options
// HTML/CSS, license, readme) alongside them.
//
// IIFE format works both in a Chrome MV3 service worker and a Firefox MV3
// event page, so the manifest can keep its cross-browser background block
// without needing module support.
//
// Firefox MV3 doesn't recognize the `offscreen` permission and warns on
// install, so we emit a sibling dist/extension-firefox/ with that permission
// stripped from the manifest. The JS bundles are identical — the runtime
// detects whether chrome.offscreen is available and picks the right code path.

import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const chromeDir = resolve(root, 'dist/extension');
const firefoxDir = resolve(root, 'dist/extension-firefox');

rmSync(chromeDir, { recursive: true, force: true });
rmSync(firefoxDir, { recursive: true, force: true });
mkdirSync(chromeDir, { recursive: true });

const result = await Bun.build({
  entrypoints: [
    resolve(root, 'src/app/background.ts'),
    resolve(root, 'src/app/content/github-menu.ts'),
    resolve(root, 'src/app/offscreen.ts'),
    resolve(root, 'src/settings/options.tsx'),
  ],
  outdir: chromeDir,
  format: 'iife',
  target: 'browser',
  naming: { entry: '[name].[ext]' },
  // @ts-expect-error alias is supported at runtime but missing from @types/bun
  alias: {
    '@': resolve(root, 'src'),
    react: 'preact/compat',
    'react-dom': 'preact/compat',
    'react/jsx-runtime': 'preact/jsx-runtime',
  },
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

// Compile Tailwind CSS
const cssProc = Bun.spawnSync(
  [
    resolve(root, 'node_modules/.bin/tailwindcss'),
    '-i',
    resolve(root, 'src/settings/options.css'),
    '-o',
    resolve(chromeDir, 'options.css'),
    '--minify',
  ],
  { cwd: root },
);
if (cssProc.exitCode !== 0) {
  console.error(new TextDecoder().decode(cssProc.stderr));
  process.exit(1);
}

const staticFiles: Array<[from: string, to: string]> = [
  ['manifest.json', 'manifest.json'],
  ['assets/options.html', 'options.html'],
  ['assets/offscreen.html', 'offscreen.html'],
  ['LICENSE', 'LICENSE'],
  ['README.md', 'README.md'],
  ['assets/icons/icon-16.png', 'icons/icon-16.png'],
  ['assets/icons/icon-32.png', 'icons/icon-32.png'],
  ['assets/icons/icon-48.png', 'icons/icon-48.png'],
  ['assets/icons/icon-128.png', 'icons/icon-128.png'],
];
for (const [from, to] of staticFiles) {
  const dest = resolve(chromeDir, to);
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(resolve(root, from), dest);
}

// Firefox variant: copy the Chrome build wholesale, then rewrite manifest to
// drop the `offscreen` permission (Firefox doesn't support the API and warns
// when loading a manifest that asks for it).
function copyDirRecursive(src: string, dst: string): void {
  mkdirSync(dst, { recursive: true });
  for (const entry of readdirSync(src)) {
    const s = join(src, entry);
    const d = join(dst, entry);
    if (statSync(s).isDirectory()) {
      copyDirRecursive(s, d);
    } else {
      copyFileSync(s, d);
    }
  }
}

copyDirRecursive(chromeDir, firefoxDir);

// Chrome manifest transform:
// - drop `background.scripts` (Firefox event-page key; Chrome warns on the
//   unknown field).
// - drop `browser_specific_settings` (Firefox-only; some Chrome versions
//   reject the manifest when they hit nested unknown fields like
//   `data_collection_permissions`).
const chromeManifestPath = resolve(chromeDir, 'manifest.json');
const chromeManifest = JSON.parse(readFileSync(chromeManifestPath, 'utf8')) as {
  background?: { service_worker?: string; scripts?: string[] };
  browser_specific_settings?: unknown;
};
if (chromeManifest.background) delete chromeManifest.background.scripts;
delete chromeManifest.browser_specific_settings;
writeFileSync(chromeManifestPath, `${JSON.stringify(chromeManifest, null, 2)}\n`);

// Firefox manifest transform:
// - drop `offscreen` (Firefox doesn't implement the API and warns on install)
// - add `clipboardWrite` so navigator.clipboard.writeText and
//   document.execCommand('copy') work from the injected script without a
//   short-running user gesture (Firefox blocks both otherwise when the
//   keyboard shortcut fires from outside the page, e.g. focus on DevTools).
// - drop `background.service_worker` (Chrome key; Firefox MV3 runs as an
//   event page via `background.scripts`).
const ffManifestPath = resolve(firefoxDir, 'manifest.json');
const ffManifest = JSON.parse(readFileSync(ffManifestPath, 'utf8')) as {
  permissions?: string[];
  background?: { service_worker?: string; scripts?: string[] };
};
const ffPerms = new Set(Array.isArray(ffManifest.permissions) ? ffManifest.permissions : []);
ffPerms.delete('offscreen');
ffPerms.add('clipboardWrite');
ffManifest.permissions = [...ffPerms];
if (ffManifest.background) delete ffManifest.background.service_worker;
writeFileSync(ffManifestPath, `${JSON.stringify(ffManifest, null, 2)}\n`);

console.log(`built ${result.outputs.length} files into dist/extension/ + dist/extension-firefox/`);
