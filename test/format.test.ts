import { test, expect } from 'bun:test';
import {
  clampCompactPathMaxLen,
  clampDuration,
  compactPath,
  DEFAULT_GITHUB_COMPACT_PATH_MAX_LEN,
  DEFAULT_GITHUB_LINK_TEMPLATE,
  DEFAULT_LINK_TEMPLATE,
  formatGithubLink,
  formatLines,
  formatLink,
  parseConditionalFormats,
  parseGithubLinkTemplate,
  parseLinkTemplate,
  pickTemplate,
  type GithubLinkSource,
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

test('formatLink: {hash} returns fragment without leading #', () => {
  expect(formatLink({ url: SAMPLE_URL }, '{hash}')).toBe('comment-3');
});

test('formatLink: {hash} returns empty string when no fragment', () => {
  expect(formatLink({ url: 'https://github.com/foo' }, '{hash}')).toBe('');
});

test('formatLink: {query} returns full query string without leading ?', () => {
  expect(formatLink({ url: SAMPLE_URL }, '{query}')).toBe('tab=open');
});

test('formatLink: {query} returns empty string when no query string', () => {
  expect(formatLink({ url: 'https://github.com/foo' }, '{query}')).toBe('');
});

test('formatLink: {query:tab} returns value of named query parameter', () => {
  expect(formatLink({ url: SAMPLE_URL }, '{query:tab}')).toBe('open');
});

test('formatLink: {query:missing} returns empty string for absent parameter', () => {
  expect(formatLink({ url: SAMPLE_URL }, '{query:missing}')).toBe('');
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

const GH_SOURCE: GithubLinkSource = {
  url: 'https://github.com/owner/repo/blob/abc123/src/app/inject/toast.ts#L10-L20',
  owner: 'owner',
  repo: 'repo',
  ref: 'abc123',
  filepath: 'src/app/inject/toast.ts',
  startLine: 10,
  endLine: 20,
  title: 'toast.ts at abc123 · owner/repo',
};

test('compactPath: short path passes through', () => {
  expect(compactPath('src/app/background.ts', 40)).toBe('src/app/background.ts');
});

test('compactPath: long path collapses middle segments with …', () => {
  expect(compactPath('src/components/ui/widgets/buttons/PrimaryButton.tsx', 24)).toBe(
    'src/…/PrimaryButton.tsx',
  );
});

test('compactPath: 2-segment path is not collapsed', () => {
  expect(compactPath('verylongdirname/verylongfilename.ts', 10)).toBe(
    'verylongdirname/verylongfilename.ts',
  );
});

test('compactPath: single-segment path is not collapsed', () => {
  expect(compactPath('superlongsinglefilename.ts', 10)).toBe('superlongsinglefilename.ts');
});

test('formatLines: undefined start renders empty', () => {
  expect(formatLines(undefined, undefined)).toBe('');
});

test('formatLines: single line renders Lstart', () => {
  expect(formatLines(7)).toBe('L7');
});

test('formatLines: same start and end renders Lstart only', () => {
  expect(formatLines(7, 7)).toBe('L7');
});

test('formatLines: range renders Lstart-Lend', () => {
  expect(formatLines(10, 20)).toBe('L10-L20');
});

test('formatGithubLink: default template renders compact filepath + range', () => {
  const out = formatGithubLink(GH_SOURCE, DEFAULT_GITHUB_LINK_TEMPLATE, {
    compactPathMaxLen: DEFAULT_GITHUB_COMPACT_PATH_MAX_LEN,
  });
  expect(out).toBe(`[src/app/inject/toast.ts#L10-L20](${GH_SOURCE.url})`);
});

test('formatGithubLink: applies compactPath when path exceeds threshold', () => {
  const long: GithubLinkSource = { ...GH_SOURCE, filepath: 'src/a/b/c/d/e/f/long-name.ts' };
  expect(formatGithubLink(long, '{compactFilepath}', { compactPathMaxLen: 10 })).toBe(
    'src/…/long-name.ts',
  );
});

test('formatGithubLink: substitutes all tokens', () => {
  const out = formatGithubLink(GH_SOURCE, '{owner}/{repo}@{ref} {filepath}#{lines} {url} {title}', {
    compactPathMaxLen: DEFAULT_GITHUB_COMPACT_PATH_MAX_LEN,
  });
  expect(out).toBe(
    `owner/repo@abc123 src/app/inject/toast.ts#L10-L20 ${GH_SOURCE.url} ${GH_SOURCE.title}`,
  );
});

test('formatGithubLink: empty lines when selection absent', () => {
  const src: GithubLinkSource = { ...GH_SOURCE, startLine: undefined, endLine: undefined };
  expect(
    formatGithubLink(src, '[{filepath}]({url})', {
      compactPathMaxLen: DEFAULT_GITHUB_COMPACT_PATH_MAX_LEN,
    }),
  ).toBe(`[src/app/inject/toast.ts](${GH_SOURCE.url})`);
});

test('formatGithubLink: unknown token is left literal', () => {
  const out = formatGithubLink(GH_SOURCE, '{nope}-{owner}', {
    compactPathMaxLen: DEFAULT_GITHUB_COMPACT_PATH_MAX_LEN,
  });
  expect(out).toBe('{nope}-owner');
});

test('parseGithubLinkTemplate: passes through a valid string', () => {
  expect(parseGithubLinkTemplate('[{filepath}]({url})')).toBe('[{filepath}]({url})');
});

test('parseGithubLinkTemplate: empty falls back to default', () => {
  expect(parseGithubLinkTemplate('')).toBe(DEFAULT_GITHUB_LINK_TEMPLATE);
});

test('parseGithubLinkTemplate: non-string falls back to default', () => {
  expect(parseGithubLinkTemplate(undefined)).toBe(DEFAULT_GITHUB_LINK_TEMPLATE);
  expect(parseGithubLinkTemplate(42)).toBe(DEFAULT_GITHUB_LINK_TEMPLATE);
});

test('clampCompactPathMaxLen: clamps below minimum', () => {
  expect(clampCompactPathMaxLen(5)).toBe(10);
});

test('clampCompactPathMaxLen: clamps above maximum', () => {
  expect(clampCompactPathMaxLen(500)).toBe(200);
});

test('clampCompactPathMaxLen: rounds non-integer', () => {
  expect(clampCompactPathMaxLen(33.6)).toBe(34);
});

test('clampCompactPathMaxLen: defaults on non-numeric', () => {
  expect(clampCompactPathMaxLen('nope')).toBe(DEFAULT_GITHUB_COMPACT_PATH_MAX_LEN);
});

test('parseConditionalFormats: non-array returns empty', () => {
  expect(parseConditionalFormats(undefined)).toEqual([]);
  expect(parseConditionalFormats(null)).toEqual([]);
  expect(parseConditionalFormats('nope')).toEqual([]);
  expect(parseConditionalFormats({})).toEqual([]);
});

test('parseConditionalFormats: keeps valid rows and drops malformed ones, preserving order', () => {
  const input = [
    { pattern: '^https://a\\.com/', template: '[A]({url})' },
    { pattern: 42, template: '[bad]({url})' },
    { pattern: '^https://b\\.com/', template: '' },
    null,
    { pattern: '^https://c\\.com/', template: '[C]({url})' },
    { template: '[no-pattern]({url})' },
  ];
  expect(parseConditionalFormats(input)).toEqual([
    { pattern: '^https://a\\.com/', template: '[A]({url})' },
    { pattern: '^https://c\\.com/', template: '[C]({url})' },
  ]);
});

test('parseConditionalFormats: drops overlong pattern or template', () => {
  const long = 'x'.repeat(501);
  expect(
    parseConditionalFormats([
      { pattern: long, template: '[ok]({url})' },
      { pattern: '^ok', template: long },
      { pattern: '^ok', template: '[ok]({url})' },
    ]),
  ).toEqual([{ pattern: '^ok', template: '[ok]({url})' }]);
});

test('parseConditionalFormats: keeps rule with invalid regex (validated at match time)', () => {
  const input = [{ pattern: '[unclosed', template: '[X]({url})' }];
  expect(parseConditionalFormats(input)).toEqual([
    { pattern: '[unclosed', template: '[X]({url})' },
  ]);
});

test('pickTemplate: empty rules returns fallback', () => {
  expect(pickTemplate('https://example.com', [], DEFAULT_LINK_TEMPLATE)).toBe(
    DEFAULT_LINK_TEMPLATE,
  );
});

test('pickTemplate: first matching rule wins', () => {
  const rules = [
    { pattern: '^https://github\\.com/', template: '[first]({url})' },
    { pattern: '^https://', template: '[second]({url})' },
  ];
  expect(pickTemplate('https://github.com/foo', rules, DEFAULT_LINK_TEMPLATE)).toBe(
    '[first]({url})',
  );
});

test('pickTemplate: falls through when no rule matches', () => {
  const rules = [{ pattern: '^https://github\\.com/', template: '[gh]({url})' }];
  expect(pickTemplate('https://example.com', rules, DEFAULT_LINK_TEMPLATE)).toBe(
    DEFAULT_LINK_TEMPLATE,
  );
});

test('pickTemplate: invalid regex is skipped, evaluation continues', () => {
  const rules = [
    { pattern: '[unclosed', template: '[bad]({url})' },
    { pattern: '^https://', template: '[good]({url})' },
  ];
  expect(pickTemplate('https://example.com', rules, DEFAULT_LINK_TEMPLATE)).toBe('[good]({url})');
});

test('pickTemplate: all invalid rules fall through to fallback', () => {
  const rules = [
    { pattern: '[unclosed', template: '[bad1]({url})' },
    { pattern: '(unfinished', template: '[bad2]({url})' },
  ];
  expect(pickTemplate('https://example.com', rules, DEFAULT_LINK_TEMPLATE)).toBe(
    DEFAULT_LINK_TEMPLATE,
  );
});
