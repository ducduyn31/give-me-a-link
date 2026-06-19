import { type FieldPath, useFormContext } from 'react-hook-form';
import type { Settings } from '../../shared/settings';
import type { TextF } from '../types';

export default function LivePreview({ field }: { field: TextF }) {
  const { watch } = useFormContext<Settings>();
  const parsedValue = watch(field.key as FieldPath<Settings>) as string;

  return (
    <>
      {field.previewSourceLabel && (
        <div class="text-gray-500 text-xs mt-1">Preview for {field.previewSourceLabel}</div>
      )}
      <pre class="preview mt-1 px-2.5 py-2 font-mono text-xs text-gray-900 bg-gray-100 border border-gray-200 rounded-md whitespace-pre-wrap break-all">
        {field.preview!(parsedValue)}
      </pre>
    </>
  );
}
