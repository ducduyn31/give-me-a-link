import { type FieldPath, useFormContext } from 'react-hook-form';
import type { Settings } from '../../shared/settings';
import type { CheckboxF } from '../types';

export default function CheckboxField({ field }: { field: CheckboxF }) {
  const { register, watch } = useFormContext<Settings>();
  const disabled = field.disabledWhen?.(watch() as Settings) ?? false;
  const id = `f-${field.key}`;

  return (
    <div class="mb-5">
      <div class="flex items-center gap-2">
        <input
          type="checkbox"
          id={id}
          disabled={disabled}
          {...register(field.key as FieldPath<Settings>)}
        />
        <label for={id} class="font-semibold text-sm">
          {field.label}
        </label>
      </div>
      {field.hint && <div class="text-gray-500 text-xs mt-1">{field.hint}</div>}
    </div>
  );
}
