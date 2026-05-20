#!/usr/bin/env bun
// Builds the extension into dist/extension/ (Chrome) and
// dist/extension-firefox/ (Firefox), then zips each into
// dist/<name>-<version>.zip and dist/<name>-<version>-firefox.zip. Fails fast
// if either manifest.json and package.json disagree on the version.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

execFileSync('bun', ['run', 'build'], { cwd: root, stdio: 'inherit' });

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

const targets: Array<{ dir: string; zip: string; label: string }> = [
  {
    dir: resolve(root, 'dist/extension'),
    zip: resolve(root, 'dist', `${pkg.name}-${pkg.version}.zip`),
    label: 'chrome',
  },
  {
    dir: resolve(root, 'dist/extension-firefox'),
    zip: resolve(root, 'dist', `${pkg.name}-${pkg.version}-firefox.zip`),
    label: 'firefox',
  },
];

for (const { dir, zip, label } of targets) {
  const manifest = JSON.parse(readFileSync(resolve(dir, 'manifest.json'), 'utf8'));
  if (manifest.version !== pkg.version) {
    console.error(
      `version mismatch (${label}): manifest.json=${manifest.version}, package.json=${pkg.version}`,
    );
    process.exit(1);
  }
  if (existsSync(zip)) rmSync(zip);
  execFileSync('zip', ['-r', '-q', zip, '.'], { cwd: dir, stdio: 'inherit' });
  console.log(`packaged ${zip.replace(`${root}/`, '')}`);
}
