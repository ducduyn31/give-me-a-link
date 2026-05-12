#!/usr/bin/env bun
// Copies the version from package.json into manifest.json. Run by the
// `version` npm script after `changeset version`, so a bot's "Version Packages"
// PR keeps the two files in lockstep.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = resolve(root, 'manifest.json');

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const manifestRaw = readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(manifestRaw);

if (manifest.version === pkg.version) {
  console.log(`manifest.json already at ${pkg.version}`);
  process.exit(0);
}

const trailingNewline = manifestRaw.endsWith('\n') ? '\n' : '';
manifest.version = pkg.version;
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + trailingNewline);
console.log(`manifest.json -> ${pkg.version}`);
