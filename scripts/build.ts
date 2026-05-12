#!/usr/bin/env bun
// Bundles src/app/background.ts and src/settings/options.ts into
// dist/extension/ as self-contained IIFE files, then copies static assets
// (manifest, options HTML/CSS, license, readme) alongside them.
// IIFE format works both in a Chrome MV3 service worker and a Firefox MV3
// event page, so the manifest can keep its cross-browser background block
// without needing module support.

import { copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'dist/extension');

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const result = await Bun.build({
  entrypoints: [resolve(root, 'src/app/background.ts'), resolve(root, 'src/settings/options.ts')],
  outdir: outDir,
  format: 'iife',
  target: 'browser',
  naming: { entry: '[name].[ext]' },
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

const staticFiles: Array<[from: string, to: string]> = [
  ['manifest.json', 'manifest.json'],
  ['assets/options.html', 'options.html'],
  ['assets/options.css', 'options.css'],
  ['LICENSE', 'LICENSE'],
  ['README.md', 'README.md'],
  ['assets/icons/icon-16.png', 'icons/icon-16.png'],
  ['assets/icons/icon-32.png', 'icons/icon-32.png'],
  ['assets/icons/icon-48.png', 'icons/icon-48.png'],
  ['assets/icons/icon-128.png', 'icons/icon-128.png'],
];
for (const [from, to] of staticFiles) {
  const dest = resolve(outDir, to);
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(resolve(root, from), dest);
}

console.log(`built ${result.outputs.length} files into dist/extension/`);
