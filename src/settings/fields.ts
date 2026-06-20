import type { ConditionalFormat, GithubLinkSource, LinkSource } from '../shared/format';
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

interface RulesField {
  kind: 'rules';
  key: 'conditionalFormats';
  label: string;
  hint?: string;
  parse: (raw: unknown) => ConditionalFormat[];
  preview: (template: string, source: LinkSource) => string;
  defaultSample: LinkSource;
}

export type Field =
  | { [K in StringKey]: SelectField<K> | TextField<K> }[StringKey]
  | { [K in BooleanKey]: CheckboxField<K> }[BooleanKey]
  | { [K in NumberKey]: NumberField<K> }[NumberKey]
  | RulesField;

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
