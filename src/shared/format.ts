export const DEFAULT_LINK_TEMPLATE = '[{host}/{path[0]}]({url})';
export const MAX_TEMPLATE_LENGTH = 500;

export const DEFAULT_TOAST_DURATION_MS = 1500;
export const MIN_TOAST_DURATION_MS = 200;
export const MAX_TOAST_DURATION_MS = 10000;

export function parseLinkTemplate(value: unknown): string {
  if (typeof value !== 'string') return DEFAULT_LINK_TEMPLATE;
  if (value.length === 0 || value.length > MAX_TEMPLATE_LENGTH) return DEFAULT_LINK_TEMPLATE;
  return value;
}

export interface LinkSource {
  url: string;
  title?: string;
}

const PATH_INDEX = /^path\[(\d+)\]$/;

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
      default: {
        const m = PATH_INDEX.exec(key);
        if (m) return segments[Number(m[1])] ?? '';
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
