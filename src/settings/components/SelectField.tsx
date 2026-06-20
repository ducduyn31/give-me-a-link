import { type FieldPath, useFormContext } from 'react-hook-form';
import type { Settings } from '@/shared/settings';
import type { SelectF } from '../types';

export default function SelectField({ field }: { field: SelectF }) {
  const { register, watch } = useFormContext<Settings>();
  const disabled = field.disabledWhen?.(watch() as Settings) ?? false;
  const id = `f-${field.key}`;

  return (
    <div class="mb-5">
      <label for={id} class="block font-semibold mb-1.5 text-sm">
        {field.label}
      </label>
      <select
        id={id}
        disabled={disabled}
        class="w-full px-2.5 py-2 text-sm border border-gray-300 rounded-md bg-white"
        {...register(field.key as FieldPath<Settings>, { setValueAs: field.parse })}
      >
        {field.options.map((opt) => (
          <option key={String(opt.value)} value={String(opt.value)}>
            {opt.label}
          </option>
        ))}
      </select>
      {field.hint && <div class="text-gray-500 text-xs mt-1">{field.hint}</div>}
    </div>
  );
}
