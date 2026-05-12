import {
  parseLabelFormat,
  clampDuration,
  DEFAULT_TOAST_DURATION_MS,
  type LabelFormat,
} from './format';

export interface Settings {
  labelFormat: LabelFormat;
  toastEnabled: boolean;
  toastDurationMs: number;
}

export const DEFAULTS: Settings = {
  labelFormat: 'host-first-segment',
  toastEnabled: true,
  toastDurationMs: DEFAULT_TOAST_DURATION_MS,
};

function parseSettings(raw: Record<string, unknown>): Settings {
  return {
    labelFormat: parseLabelFormat(raw.labelFormat),
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
