import { clampDuration, parseLabelFormat } from '../shared/format';
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
  | { [K in StringKey]: SelectField<K> }[StringKey]
  | { [K in BooleanKey]: CheckboxField<K> }[BooleanKey]
  | { [K in NumberKey]: NumberField<K> }[NumberKey];

export const FIELDS: ReadonlyArray<Field> = [
  {
    kind: 'select',
    key: 'labelFormat',
    label: 'Label format',
    hint:
      'Controls what appears inside the [...] of the Markdown link. ' +
      'The URL in (...) always includes the full query and hash.',
    options: [
      { value: 'host', label: 'host — e.g. github.com' },
      {
        value: 'host-first-segment',
        label: 'host + first segment — e.g. github.com/anthropics',
      },
      {
        value: 'host-full-path',
        label: 'host + full path — e.g. github.com/anthropics/claude-code/issues/123',
      },
    ],
    parse: parseLabelFormat,
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
