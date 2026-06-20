import { clampDuration } from '@/shared/format';
import CheckboxField from '../components/CheckboxField';
import NumberField from '../components/NumberField';
import type { CheckboxF, NumberF } from '../types';

export const toastEnabledField: CheckboxF = {
  kind: 'checkbox',
  key: 'toastEnabled',
  label: 'Show confirmation toast on copy',
};

export const toastDurationMsField: NumberF = {
  kind: 'number',
  key: 'toastDurationMs',
  label: 'Toast duration (ms)',
  hint: 'Between 200 and 10000. Ignored when the toast is disabled.',
  min: 200,
  max: 10000,
  step: 100,
  disabledWhen: (s) => !s.toastEnabled,
  parse: clampDuration,
};

export default function ToastSettings() {
  return (
    <>
      <CheckboxField field={toastEnabledField} />
      <NumberField field={toastDurationMsField} />
    </>
  );
}
