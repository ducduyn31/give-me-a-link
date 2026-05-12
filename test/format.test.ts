import { test, expect } from 'bun:test';
import {
  clampDuration,
  DEFAULT_LINK_TEMPLATE,
  formatLink,
  parseLinkTemplate,
} from '../src/shared/format';

const SAMPLE_URL = 'https://github.com/ducduyn31/give-me-a-link/issues/12?tab=open#comment-3';

test('formatLink: {host} strips leading www.', () => {
  expect(formatLink({ url: 'https://www.github.com/foo' }, '{host}')).toBe('github.com');
});

test('formatLink: {path} returns full pathname with leading slash', () => {
  expect(formatLink({ url: SAMPLE_URL }, '{path}')).toBe('/ducduyn31/give-me-a-link/issues/12');
});

test('formatLink: {path[0]} returns first non-empty segment', () => {
  expect(formatLink({ url: SAMPLE_URL }, '{path[0]}')).toBe('ducduyn31');
});

test('formatLink: {path[2]} returns deeper segment', () => {
  expect(formatLink({ url: SAMPLE_URL }, '{path[2]}')).toBe('issues');
});

test('formatLink: {path[9]} out of range renders empty', () => {
  expect(formatLink({ url: SAMPLE_URL }, 'a{path[9]}b')).toBe('ab');
});

test('formatLink: {url} preserves query and hash', () => {
  expect(formatLink({ url: SAMPLE_URL }, '{url}')).toBe(SAMPLE_URL);
});

test('formatLink: {title} falls back to empty when missing', () => {
  expect(formatLink({ url: SAMPLE_URL }, '<{title}>')).toBe('<>');
});

test('formatLink: {title} is included when provided', () => {
  expect(formatLink({ url: SAMPLE_URL, title: 'Hello' }, '{title}')).toBe('Hello');
});

test('formatLink: unknown {token} is left literal', () => {
  expect(formatLink({ url: SAMPLE_URL }, '{nope}-{host}')).toBe('{nope}-github.com');
});

test('formatLink: default template matches host + first segment shape', () => {
  expect(formatLink({ url: SAMPLE_URL }, DEFAULT_LINK_TEMPLATE)).toBe(
    `[github.com/ducduyn31](${SAMPLE_URL})`,
  );
});

test('formatLink: default template on path-less URL yields trailing slash in label', () => {
  expect(formatLink({ url: 'https://github.com/' }, DEFAULT_LINK_TEMPLATE)).toBe(
    '[github.com/](https://github.com/)',
  );
});

test('parseLinkTemplate: passes through a valid string', () => {
  expect(parseLinkTemplate('[{host}]({url})')).toBe('[{host}]({url})');
});

test('parseLinkTemplate: empty string falls back to default', () => {
  expect(parseLinkTemplate('')).toBe(DEFAULT_LINK_TEMPLATE);
});

test('parseLinkTemplate: overlong string falls back to default', () => {
  expect(parseLinkTemplate('x'.repeat(501))).toBe(DEFAULT_LINK_TEMPLATE);
});

test('parseLinkTemplate: non-string falls back to default', () => {
  expect(parseLinkTemplate(undefined)).toBe(DEFAULT_LINK_TEMPLATE);
  expect(parseLinkTemplate(null)).toBe(DEFAULT_LINK_TEMPLATE);
  expect(parseLinkTemplate(42)).toBe(DEFAULT_LINK_TEMPLATE);
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
