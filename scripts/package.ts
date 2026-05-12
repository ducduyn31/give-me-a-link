#!/usr/bin/env bun
// Builds the extension into dist/extension/, then zips it into
// dist/<name>-<version>.zip. Fails fast if manifest.json and package.json
// disagree on the version.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

execFileSync('bun', ['run', 'build'], { cwd: root, stdio: 'inherit' });

const extDir = resolve(root, 'dist/extension');
const manifest = JSON.parse(readFileSync(resolve(extDir, 'manifest.json'), 'utf8'));
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

if (manifest.version !== pkg.version) {
  console.error(`version mismatch: manifest.json=${manifest.version}, package.json=${pkg.version}`);
  process.exit(1);
}

const zipName = `${pkg.name}-${pkg.version}.zip`;
const zipPath = resolve(root, 'dist', zipName);
if (existsSync(zipPath)) rmSync(zipPath);

execFileSync('zip', ['-r', '-q', zipPath, '.'], { cwd: extDir, stdio: 'inherit' });
console.log(`packaged dist/${zipName}`);
