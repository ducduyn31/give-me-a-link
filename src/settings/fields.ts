import {
  clampDuration,
  DEFAULT_LINK_TEMPLATE,
  formatLink,
  parseLinkTemplate,
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
  url: 'https://github.com/ducduyn31/url-md-link/issues/12?tab=open#comment-3',
  title: 'Issues · ducduyn31/url-md-link',
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
];
