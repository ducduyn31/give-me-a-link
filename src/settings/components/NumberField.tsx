import { type FieldPath, useFormContext } from 'react-hook-form';
import { cn } from '@/shared/cn';
import type { Settings } from '@/shared/settings';
import type { NumberF } from '../types';

export default function NumberField({ field }: { field: NumberF }) {
  const { register, watch } = useFormContext<Settings>();
  const disabled = field.disabledWhen?.(watch() as Settings) ?? false;
  const id = `f-${field.key}`;

  return (
    <div class="mb-5">
      <label for={id} class="block font-semibold mb-1.5 text-sm">
        {field.label}
      </label>
      <input
        type="number"
        id={id}
        min={field.min}
        max={field.max}
        step={field.step}
        disabled={disabled}
        class={cn(
          'w-full px-2.5 py-2 text-sm',
          'border border-gray-300 rounded-md bg-white',
          'disabled:text-gray-400 disabled:bg-gray-50',
        )}
        {...register(field.key as FieldPath<Settings>, { setValueAs: field.parse })}
      />
      {field.hint && <div class="text-gray-500 text-xs mt-1">{field.hint}</div>}
    </div>
  );
}
