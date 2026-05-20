#!/usr/bin/env bun
// Builds, packages, and ships the extension to the Chrome Web Store and
// Firefox AMO, then creates a GitHub release with the zip attached.
//
// Designed to be run from the `release` GitHub Actions job after the
// changesets "Version Packages" PR has been merged. Each upload step is
// gated on its env vars being present, so a partial secret setup degrades
// gracefully — the script logs what it skipped and exits 0 unless an
// actual upload failed.
//
// Required env (Chrome):     CHROME_EXTENSION_ID, CHROME_CLIENT_ID,
//                            CHROME_CLIENT_SECRET, CHROME_REFRESH_TOKEN
// Required env (Firefox):    FIREFOX_JWT_ISSUER, FIREFOX_JWT_SECRET
// Required env (GH release): GITHUB_TOKEN (provided by Actions)

import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const version: string = pkg.version;
const chromeZip = resolve(root, 'dist', `${pkg.name}-${version}.zip`);
const firefoxZip = resolve(root, 'dist', `${pkg.name}-${version}-firefox.zip`);
const firefoxDir = resolve(root, 'dist/extension-firefox');
const tag = `v${version}`;

// changesets/action calls `publish` on every push to main, even when there
// are no pending changesets. Bail early if this version is already released
// so subsequent pushes (e.g. dependabot merges) don't try to re-upload.
// Important: only treat an explicit "not found" as "go ahead and release" —
// any other gh failure (auth/network) must abort so we don't re-upload
// binaries to the Chrome/Firefox stores.
if (process.env.GITHUB_TOKEN) {
  const existing = spawnSync('gh', ['release', 'view', tag], { cwd: root, encoding: 'utf8' });
  if (existing.status === 0) {
    console.log(`Release ${tag} already exists, nothing to do.`);
    process.exit(0);
  }
  const stderr = (existing.stderr || '') + (existing.stdout || '');
  if (!/not found/i.test(stderr)) {
    console.error(`gh release view ${tag} failed (exit ${existing.status}):\n${stderr}`);
    process.exit(1);
  }
}

execFileSync('bun', ['run', 'package'], { cwd: root, stdio: 'inherit' });

const skipped: string[] = [];

function need(...keys: string[]): Record<string, string> | null {
  const missing = keys.filter((k) => !process.env[k]);
  if (missing.length) {
    skipped.push(`${keys[0].split('_')[0]} (missing: ${missing.join(', ')})`);
    return null;
  }
  return Object.fromEntries(keys.map((k) => [k, process.env[k]!]));
}

// Chrome Web Store
const chrome = need(
  'CHROME_EXTENSION_ID',
  'CHROME_CLIENT_ID',
  'CHROME_CLIENT_SECRET',
  'CHROME_REFRESH_TOKEN',
);
if (chrome) {
  console.log(`\n→ Chrome Web Store: uploading ${chromeZip}`);
  execFileSync(
    'bunx',
    [
      'chrome-webstore-upload-cli@3',
      'upload',
      '--source',
      chromeZip,
      '--extension-id',
      chrome.CHROME_EXTENSION_ID,
      '--client-id',
      chrome.CHROME_CLIENT_ID,
      '--client-secret',
      chrome.CHROME_CLIENT_SECRET,
      '--refresh-token',
      chrome.CHROME_REFRESH_TOKEN,
      '--auto-publish',
    ],
    { cwd: root, stdio: 'inherit' },
  );
}

// Firefox AMO
const firefox = need('FIREFOX_JWT_ISSUER', 'FIREFOX_JWT_SECRET');
if (firefox) {
  console.log(`\n→ Firefox AMO: signing + submitting ${firefoxDir}`);
  execFileSync(
    'bunx',
    [
      'web-ext@8',
      'sign',
      '--channel=listed',
      `--source-dir=${firefoxDir}`,
      `--artifacts-dir=${resolve(root, 'dist/web-ext-artifacts')}`,
      `--api-key=${firefox.FIREFOX_JWT_ISSUER}`,
      `--api-secret=${firefox.FIREFOX_JWT_SECRET}`,
    ],
    { cwd: root, stdio: 'inherit' },
  );
}

// GitHub release
if (process.env.GITHUB_TOKEN) {
  console.log(`\n→ GitHub release: ${tag}`);
  const changelog = readFileSync(resolve(root, 'CHANGELOG.md'), 'utf8');
  // Pull just this version's section out of the changelog (between
  // `## <version>` and the next `## ` header).
  const escaped = version.replace(/\./g, '\\.');
  const match = changelog.match(
    new RegExp(`^## (?:\\[)?${escaped}.*?$([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, 'm'),
  );
  const notes = match?.[1]?.trim() || `Release ${tag}`;
  execFileSync(
    'gh',
    ['release', 'create', tag, chromeZip, firefoxZip, '--title', tag, '--notes', notes],
    { cwd: root, stdio: 'inherit' },
  );
} else {
  skipped.push('GitHub release (missing: GITHUB_TOKEN)');
}

if (skipped.length) {
  console.log(`\nSkipped: ${skipped.join('; ')}`);
}
console.log(`\nReleased ${pkg.name}@${version}`);
