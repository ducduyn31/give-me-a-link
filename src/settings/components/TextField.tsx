import { type FieldPath, useFormContext } from 'react-hook-form';
import type { Settings } from '../../shared/settings';
import type { TextF } from '../types';

export default function TextField({ field }: { field: TextF }) {
  const { register, watch } = useFormContext<Settings>();
  const disabled = field.disabledWhen?.(watch() as Settings) ?? false;
  const id = `f-${field.key}`;

  return (
    <>
      <label for={id} class="block font-semibold mb-1.5 text-sm">
        {field.label}
      </label>
      <input
        type="text"
        id={id}
        placeholder={field.placeholder}
        disabled={disabled}
        class="w-full px-2.5 py-2 text-sm font-mono border border-gray-300 rounded-md bg-white disabled:text-gray-400 disabled:bg-gray-50"
        {...register(field.key as FieldPath<Settings>, { setValueAs: field.parse })}
      />
      {field.hint && <div class="text-gray-500 text-xs mt-1">{field.hint}</div>}
    </>
  );
}
