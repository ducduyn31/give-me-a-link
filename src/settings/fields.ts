import {
  clampCompactPathMaxLen,
  clampDuration,
  DEFAULT_GITHUB_COMPACT_PATH_MAX_LEN,
  DEFAULT_GITHUB_LINK_TEMPLATE,
  DEFAULT_LINK_TEMPLATE,
  formatGithubLink,
  formatLink,
  parseGithubLinkTemplate,
  parseLinkTemplate,
  type GithubLinkSource,
  type LinkSource,
} from '../shared/format';
import type { Settings } from '../shared/settings';

type KeysOfType<T, V> = { [K in keyof T]: T[K] extends V ? K : never }[keyof T];

type StringKey = KeysOfType<Settings, string>;
type BooleanKey = KeysOfType<Settings, boolean>;
type NumberKey = KeysOfType<Settings, number>;

interface SelectField<K extends StringKey> {
  kind: 'select';
  key: K;
  label: string;
  hint?: string;
  disabledWhen?: (s: Settings) => boolean;
  options: ReadonlyArray<{ value: Settings[K]; label: string }>;
  parse: (raw: unknown) => Settings[K];
}

interface TextField<K extends StringKey> {
  kind: 'text';
  key: K;
  label: string;
  hint?: string;
  placeholder?: string;
  disabledWhen?: (s: Settings) => boolean;
  parse: (raw: unknown) => Settings[K];
  preview?: (parsed: Settings[K]) => string;
  previewSourceLabel?: string;
}

interface CheckboxField<K extends BooleanKey> {
  kind: 'checkbox';
  key: K;
  label: string;
  hint?: string;
  disabledWhen?: (s: Settings) => boolean;
}

interface NumberField<K extends NumberKey> {
  kind: 'number';
  key: K;
  label: string;
  hint?: string;
  disabledWhen?: (s: Settings) => boolean;
  min: number;
  max: number;
  step: number;
  parse: (raw: unknown) => Settings[K];
}

export type Field =
  | { [K in StringKey]: SelectField<K> | TextField<K> }[StringKey]
  | { [K in BooleanKey]: CheckboxField<K> }[BooleanKey]
  | { [K in NumberKey]: NumberField<K> }[NumberKey];

export const PREVIEW_SAMPLE: LinkSource = {
  url: 'https://github.com/ducduyn31/give-me-a-link/issues/12?tab=open#comment-3',
  title: 'Issues · ducduyn31/give-me-a-link',
};

export const PREVIEW_GITHUB_SAMPLE: GithubLinkSource = {
  url: 'https://github.com/ducduyn31/give-me-a-link/blob/0123456789abcdef/src/app/inject/toast.ts#L10-L20',
  owner: 'ducduyn31',
  repo: 'give-me-a-link',
  ref: '0123456789abcdef',
  filepath: 'src/app/inject/toast.ts',
  startLine: 10,
  endLine: 20,
  title: 'give-me-a-link/src/app/inject/toast.ts at main · ducduyn31/give-me-a-link',
};

export const FIELDS: ReadonlyArray<Field> = [
  {
    kind: 'text',
    key: 'linkTemplate',
    label: 'Clipboard template',
    hint:
      'Tokens: {host}, {path}, {path[0]} (or any non-negative index), {url}, {title}. ' +
      'Unknown {tokens} are left as-is. Empty value falls back to the default.',
    placeholder: DEFAULT_LINK_TEMPLATE,
    parse: parseLinkTemplate,
    preview: (template) => formatLink(PREVIEW_SAMPLE, template),
    previewSourceLabel: PREVIEW_SAMPLE.url,
  },
  {
    kind: 'checkbox',
    key: 'toastEnabled',
    label: 'Show confirmation toast on copy',
  },
  {
    kind: 'number',
    key: 'toastDurationMs',
    label: 'Toast duration (ms)',
    hint: 'Between 200 and 10000. Ignored when the toast is disabled.',
    min: 200,
    max: 10000,
    step: 100,
    disabledWhen: (s) => !s.toastEnabled,
    parse: clampDuration,
  },
  {
    kind: 'text',
    key: 'githubLinkTemplate',
    label: 'GitHub line-link template',
    hint:
      'Used by the "Copy as Markdown link" item injected into GitHub\'s blob-page selection menu. ' +
      'Tokens: {owner}, {repo}, {ref}, {filepath}, {compactFilepath}, {lines}, {url}, {title}. ' +
      'Unknown {tokens} are left as-is. Empty value falls back to the default.',
    placeholder: DEFAULT_GITHUB_LINK_TEMPLATE,
    parse: parseGithubLinkTemplate,
    preview: (template) =>
      formatGithubLink(PREVIEW_GITHUB_SAMPLE, template, {
        compactPathMaxLen: DEFAULT_GITHUB_COMPACT_PATH_MAX_LEN,
      }),
    previewSourceLabel: PREVIEW_GITHUB_SAMPLE.url,
  },
  {
    kind: 'number',
    key: 'githubCompactPathMaxLen',
    label: 'GitHub compact path threshold (chars)',
    hint:
      'When {compactFilepath} is used, paths longer than this collapse middle segments with "…". ' +
      'Between 10 and 200.',
    min: 10,
    max: 200,
    step: 1,
    parse: clampCompactPathMaxLen,
  },
];
