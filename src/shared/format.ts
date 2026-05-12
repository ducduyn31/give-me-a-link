/**
 * Supported label formats for the Markdown link's `[label]` portion.
 *
 * The URL inside `(...)` is always the full original href (query + hash
 * preserved). Only the label changes. `www.` is always stripped from the host.
 *
 * - `host` — host only.
 *     `https://www.github.com/anthropics/claude-code` → `[github.com](...)`
 * - `host-first-segment` — host plus the first non-empty path segment. Falls
 *   back to host alone when the path is empty.
 *     `https://github.com/anthropics/claude-code/issues/123`
 *       → `[github.com/anthropics](...)`
 *     `https://github.com/` → `[github.com](...)`
 * - `host-full-path` — host plus the full pathname, with any trailing slash
 *   stripped from the label only (the URL inside `(...)` keeps it).
 *     `https://example.com/a/b/` → `[example.com/a/b](https://example.com/a/b/)`
 *
 * This tuple is the runtime source of truth: it's iterated by
 * `parseLabelFormat` to validate untrusted input (chrome.storage values, the
 * options-page select element) and it derives the `LabelFormat` type. Adding
 * a new format here is the only change needed to make it accepted at the
 * boundary — `formatLink`'s switch will then fail to typecheck until handled.
 */
export const LABEL_FORMATS = ['host', 'host-first-segment', 'host-full-path'] as const;
export type LabelFormat = (typeof LABEL_FORMATS)[number];

export const DEFAULT_LABEL_FORMAT: LabelFormat = 'host-first-segment';
export const DEFAULT_TOAST_DURATION_MS = 1500;
export const MIN_TOAST_DURATION_MS = 200;
export const MAX_TOAST_DURATION_MS = 10000;

export function parseLabelFormat(value: unknown): LabelFormat {
  return (LABEL_FORMATS as readonly string[]).includes(value as string)
    ? (value as LabelFormat)
    : DEFAULT_LABEL_FORMAT;
}

export function formatLink(urlString: string, labelFormat: LabelFormat): string {
  const url = new URL(urlString);
  const host = url.hostname.replace(/^www\./, '');

  switch (labelFormat) {
    case 'host':
      return `[${host}](${url.href})`;
    case 'host-full-path': {
      const path = url.pathname.replace(/\/$/, '');
      return `[${path ? host + path : host}](${url.href})`;
    }
    case 'host-first-segment': {
      const first = url.pathname.split('/').find(Boolean);
      return `[${first ? `${host}/${first}` : host}](${url.href})`;
    }
  }
}

export function clampDuration(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return DEFAULT_TOAST_DURATION_MS;
  return Math.min(MAX_TOAST_DURATION_MS, Math.max(MIN_TOAST_DURATION_MS, Math.round(num)));
}
