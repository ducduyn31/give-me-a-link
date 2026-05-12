import { test, expect } from 'bun:test';
import { formatLink, clampDuration, parseLabelFormat } from '../src/shared/format';

test('formatLink: host strips leading www.', () => {
  expect(formatLink('https://www.github.com/anthropics/claude-code', 'host')).toBe(
    '[github.com](https://www.github.com/anthropics/claude-code)',
  );
});

test('formatLink: host-first-segment includes the first path segment', () => {
  expect(
    formatLink('https://github.com/anthropics/claude-code/issues/123', 'host-first-segment'),
  ).toBe('[github.com/anthropics](https://github.com/anthropics/claude-code/issues/123)');
});

test('formatLink: host-first-segment with no path falls back to host', () => {
  expect(formatLink('https://github.com/', 'host-first-segment')).toBe(
    '[github.com](https://github.com/)',
  );
});

test('formatLink: host-full-path strips trailing slash from the label only', () => {
  expect(formatLink('https://example.com/a/b/', 'host-full-path')).toBe(
    '[example.com/a/b](https://example.com/a/b/)',
  );
});

test('formatLink: URL keeps query and hash', () => {
  expect(formatLink('https://example.com/x?q=1#frag', 'host')).toBe(
    '[example.com](https://example.com/x?q=1#frag)',
  );
});

test('parseLabelFormat: passes through known values', () => {
  expect(parseLabelFormat('host')).toBe('host');
  expect(parseLabelFormat('host-first-segment')).toBe('host-first-segment');
  expect(parseLabelFormat('host-full-path')).toBe('host-full-path');
});

test('parseLabelFormat: falls back to default on unknown input', () => {
  expect(parseLabelFormat('unknown')).toBe('host-first-segment');
  expect(parseLabelFormat(undefined)).toBe('host-first-segment');
  expect(parseLabelFormat(null)).toBe('host-first-segment');
  expect(parseLabelFormat(42)).toBe('host-first-segment');
});

test('clampDuration: clamps below minimum', () => {
  expect(clampDuration(50)).toBe(200);
});

test('clampDuration: clamps above maximum', () => {
  expect(clampDuration(99999)).toBe(10000);
});

test('clampDuration: rounds non-integer input', () => {
  expect(clampDuration(1234.7)).toBe(1235);
});

test('clampDuration: defaults on non-numeric input', () => {
  expect(clampDuration('not a number')).toBe(1500);
});

test('clampDuration: defaults on undefined', () => {
  expect(clampDuration(undefined)).toBe(1500);
});
