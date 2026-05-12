import {
  parseLinkTemplate,
  clampDuration,
  DEFAULT_LINK_TEMPLATE,
  DEFAULT_TOAST_DURATION_MS,
} from './format';

export interface Settings {
  linkTemplate: string;
  toastEnabled: boolean;
  toastDurationMs: number;
}

export const DEFAULTS: Settings = {
  linkTemplate: DEFAULT_LINK_TEMPLATE,
  toastEnabled: true,
  toastDurationMs: DEFAULT_TOAST_DURATION_MS,
};

function parseSettings(raw: Record<string, unknown>): Settings {
  return {
    linkTemplate: parseLinkTemplate(raw.linkTemplate),
    toastEnabled: typeof raw.toastEnabled === 'boolean' ? raw.toastEnabled : DEFAULTS.toastEnabled,
    toastDurationMs: clampDuration(raw.toastDurationMs),
  };
}

export async function loadSettings(): Promise<Settings> {
  const raw = await chrome.storage.local.get({ ...DEFAULTS });
  return parseSettings(raw);
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  await chrome.storage.local.set(patch);
}
