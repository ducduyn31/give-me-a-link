import {
  clampCompactPathMaxLen,
  clampDuration,
  type ConditionalFormat,
  DEFAULT_GITHUB_COMPACT_PATH_MAX_LEN,
  DEFAULT_GITHUB_LINK_TEMPLATE,
  DEFAULT_LINK_TEMPLATE,
  DEFAULT_TOAST_DURATION_MS,
  parseConditionalFormats,
  parseGithubLinkTemplate,
  parseLinkTemplate,
} from './format';

export interface Settings {
  linkTemplate: string;
  conditionalFormats: ConditionalFormat[];
  toastEnabled: boolean;
  toastDurationMs: number;
  githubLinkTemplate: string;
  githubCompactPathMaxLen: number;
}

export const DEFAULTS: Settings = {
  linkTemplate: DEFAULT_LINK_TEMPLATE,
  conditionalFormats: [],
  toastEnabled: true,
  toastDurationMs: DEFAULT_TOAST_DURATION_MS,
  githubLinkTemplate: DEFAULT_GITHUB_LINK_TEMPLATE,
  githubCompactPathMaxLen: DEFAULT_GITHUB_COMPACT_PATH_MAX_LEN,
};

function parseSettings(raw: Record<string, unknown>): Settings {
  return {
    linkTemplate: parseLinkTemplate(raw.linkTemplate),
    conditionalFormats: parseConditionalFormats(raw.conditionalFormats),
    toastEnabled: typeof raw.toastEnabled === 'boolean' ? raw.toastEnabled : DEFAULTS.toastEnabled,
    toastDurationMs: clampDuration(raw.toastDurationMs),
    githubLinkTemplate: parseGithubLinkTemplate(raw.githubLinkTemplate),
    githubCompactPathMaxLen: clampCompactPathMaxLen(raw.githubCompactPathMaxLen),
  };
}

export async function loadSettings(): Promise<Settings> {
  const raw = await chrome.storage.local.get({ ...DEFAULTS });
  return parseSettings(raw);
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  await chrome.storage.local.set(patch);
}
