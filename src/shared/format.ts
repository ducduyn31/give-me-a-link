export const DEFAULT_LINK_TEMPLATE = '[{host}/{path[0]}]({url})';
export const MAX_TEMPLATE_LENGTH = 500;

export const DEFAULT_TOAST_DURATION_MS = 1500;
export const MIN_TOAST_DURATION_MS = 200;
export const MAX_TOAST_DURATION_MS = 10000;

export const DEFAULT_GITHUB_LINK_TEMPLATE = '[{compactFilepath}#{lines}]({url})';
export const DEFAULT_GITHUB_COMPACT_PATH_MAX_LEN = 40;
export const MIN_GITHUB_COMPACT_PATH_MAX_LEN = 10;
export const MAX_GITHUB_COMPACT_PATH_MAX_LEN = 200;

function validateTemplate(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  if (value.length === 0 || value.length > MAX_TEMPLATE_LENGTH) return fallback;
  return value;
}

export function parseLinkTemplate(value: unknown): string {
  return validateTemplate(value, DEFAULT_LINK_TEMPLATE);
}

export function parseGithubLinkTemplate(value: unknown): string {
  return validateTemplate(value, DEFAULT_GITHUB_LINK_TEMPLATE);
}

export interface ConditionalFormat {
  pattern: string;
  template: string;
}

function isValidPattern(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= MAX_TEMPLATE_LENGTH;
}

function isValidTemplate(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= MAX_TEMPLATE_LENGTH;
}

export function parseConditionalFormats(value: unknown): ConditionalFormat[] {
  if (!Array.isArray(value)) return [];
  const out: ConditionalFormat[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const pattern = (entry as Record<string, unknown>).pattern;
    const template = (entry as Record<string, unknown>).template;
    if (!isValidPattern(pattern) || !isValidTemplate(template)) continue;
    out.push({ pattern, template });
  }
  return out;
}

export function pickTemplate(
  url: string,
  rules: ReadonlyArray<ConditionalFormat>,
  fallback: string,
): string {
  for (const rule of rules) {
    try {
      if (new RegExp(rule.pattern).test(url)) return rule.template;
    } catch {
      // invalid regex → skip
    }
  }
  return fallback;
}

export interface LinkSource {
  url: string;
  title?: string;
}

const PATH_INDEX = /^path\[(\d+)\]$/;
const QUERY_PARAM = /^query:(.+)$/;

export function formatLink(source: LinkSource, template: string): string {
  const u = new URL(source.url);
  const host = u.hostname.replace(/^www\./, '');
  const segments = u.pathname.split('/').filter(Boolean);
  const title = source.title ?? '';

  return template.replace(/\{([^}]+)\}/g, (raw, key: string) => {
    switch (key) {
      case 'host':
        return host;
      case 'path':
        return u.pathname;
      case 'url':
        return u.href;
      case 'title':
        return title;
      case 'hash':
        return u.hash.replace(/^#/, '');
      case 'query':
        return u.search.replace(/^\?/, '');
      default: {
        const m = PATH_INDEX.exec(key);
        if (m) return segments[Number(m[1])] ?? '';
        const q = QUERY_PARAM.exec(key);
        if (q) return u.searchParams.get(q[1]) ?? '';
        return raw;
      }
    }
  });
}

export function clampDuration(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return DEFAULT_TOAST_DURATION_MS;
  return Math.min(MAX_TOAST_DURATION_MS, Math.max(MIN_TOAST_DURATION_MS, Math.round(num)));
}

export function clampCompactPathMaxLen(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return DEFAULT_GITHUB_COMPACT_PATH_MAX_LEN;
  return Math.min(
    MAX_GITHUB_COMPACT_PATH_MAX_LEN,
    Math.max(MIN_GITHUB_COMPACT_PATH_MAX_LEN, Math.round(num)),
  );
}

// Collapse middle segments of a path with U+2026 (…) when it exceeds maxLen.
// Keeps the first and last segments intact — useful so the filename remains
// visible. If the path has fewer than 3 segments, returns it unchanged because
// there is no middle to elide.
//
// `maxLen` is a trigger for compaction, not a hard cap: the result may still
// exceed it (e.g. when the first or last segment is itself longer than maxLen).
export function compactPath(path: string, maxLen: number): string {
  if (path.length <= maxLen) return path;
  const segments = path.split('/').filter(Boolean);
  if (segments.length < 3) return path;
  const first = segments[0];
  const last = segments[segments.length - 1];
  return `${first}/…/${last}`;
}

export interface GithubLinkSource {
  url: string;
  owner: string;
  repo: string;
  ref: string;
  filepath: string;
  startLine?: number;
  endLine?: number;
  title?: string;
}

export interface GithubLinkOptions {
  compactPathMaxLen: number;
}

export function formatLines(startLine?: number, endLine?: number): string {
  if (startLine === undefined) return '';
  if (endLine === undefined || endLine === startLine) return `L${startLine}`;
  return `L${startLine}-L${endLine}`;
}

export function formatGithubLink(
  source: GithubLinkSource,
  template: string,
  opts: GithubLinkOptions,
): string {
  const title = source.title ?? '';
  const lines = formatLines(source.startLine, source.endLine);
  const compactFilepath = compactPath(source.filepath, opts.compactPathMaxLen);

  return template.replace(/\{([^}]+)\}/g, (raw, key: string) => {
    switch (key) {
      case 'owner':
        return source.owner;
      case 'repo':
        return source.repo;
      case 'ref':
        return source.ref;
      case 'filepath':
        return source.filepath;
      case 'compactFilepath':
        return compactFilepath;
      case 'lines':
        return lines;
      case 'url':
        return source.url;
      case 'title':
        return title;
      default:
        return raw;
    }
  });
}
