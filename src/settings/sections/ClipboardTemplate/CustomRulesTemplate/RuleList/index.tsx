import { useFieldArray, useFormContext } from 'react-hook-form';
import type { Settings } from '../../../../../shared/settings';
import type { RulesF } from '../../../../types';
import RuleRow from './RuleRow';

export default function RuleList({ field, testUrl }: { field: RulesF; testUrl: string }) {
  const { control } = useFormContext<Settings>();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'conditionalFormats',
  });

  const matchedIndex = (() => {
    if (!testUrl) return -1;
    for (let i = 0; i < fields.length; i++) {
      if (!fields[i].pattern) continue;
      try {
        if (new RegExp(fields[i].pattern).test(testUrl)) return i;
      } catch {
        // invalid regex — skip
      }
    }
    return -1;
  })();

  return (
    <>
      <div class="flex flex-col gap-3 my-2">
        {fields.map((item, index) => (
          <RuleRow
            key={item.id}
            index={index}
            total={fields.length}
            matched={index === matchedIndex}
            testUrl={testUrl}
            field={field}
            onRemove={() => remove(index)}
            onMoveUp={() => move(index, index - 1)}
            onMoveDown={() => move(index, index + 1)}
          />
        ))}
      </div>
      <button
        type="button"
        class="mt-2 px-3 py-1.5 text-sm border border-dashed border-gray-400 rounded-md bg-white text-gray-700 cursor-pointer hover:border-blue-600 hover:text-blue-600"
        onClick={() => append({ pattern: '', template: '' })}
      >
        + Add rule
      </button>
    </>
  );
}
