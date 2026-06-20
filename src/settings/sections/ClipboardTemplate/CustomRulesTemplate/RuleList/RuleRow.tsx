import { type FieldPath, useFormContext } from 'react-hook-form';
import { cn } from '@/shared/cn';
import type { LinkSource } from '@/shared/format';
import type { Settings } from '@/shared/settings';
import type { RulesF } from '@/settings/types';
import { isValidRegex, regexError } from '@/settings/utils';

export default function RuleRow({
  index,
  total,
  matched,
  testUrl,
  field,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  index: number;
  total: number;
  matched: boolean;
  testUrl: string;
  field: RulesF;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const { register, watch } = useFormContext<Settings>();
  const patternKey = `conditionalFormats.${index}.pattern` as FieldPath<Settings>;
  const templateKey = `conditionalFormats.${index}.template` as FieldPath<Settings>;
  const pattern = (watch(patternKey) as string) ?? '';
  const template = (watch(templateKey) as string) ?? '';

  const patternError =
    pattern.length > 0 && !isValidRegex(pattern) ? `Invalid regex: ${regexError(pattern)}` : null;

  const previewSource: LinkSource =
    matched && testUrl.length > 0 ? { url: testUrl } : field.defaultSample;

  let previewText: string;
  try {
    previewText = field.preview(template, previewSource);
  } catch {
    previewText = '';
  }

  const moveButtonClass = cn(
    'bg-transparent border border-gray-300 rounded',
    'text-gray-700 text-xs leading-none cursor-pointer',
    'px-1.5 py-0.5 min-w-[22px]',
    'hover:border-blue-600 hover:text-blue-600',
    'disabled:text-gray-300 disabled:border-gray-100 disabled:cursor-not-allowed',
  );

  return (
    <div
      class={cn(
        'rule border border-l-[3px] rounded-md p-3 bg-white',
        matched ? 'rule--matched border-l-blue-600 bg-blue-50 border-gray-200' : 'border-gray-200',
      )}
    >
      <div class="flex items-center justify-between mb-2">
        <span class="font-semibold text-sm text-gray-700">Rule {index + 1}</span>
        <div class="flex items-center gap-1">
          <button
            type="button"
            class={moveButtonClass}
            title="Move up"
            aria-label="Move rule up"
            disabled={index === 0}
            onClick={onMoveUp}
          >
            ↑
          </button>
          <button
            type="button"
            class={moveButtonClass}
            title="Move down"
            aria-label="Move rule down"
            disabled={index === total - 1}
            onClick={onMoveDown}
          >
            ↓
          </button>
          <button
            type="button"
            class="bg-transparent border-0 text-gray-500 text-xs cursor-pointer px-1.5 py-0.5 hover:text-red-700"
            onClick={onRemove}
          >
            Remove
          </button>
        </div>
      </div>
      <label for={`rule-${index}-pattern`} class="block text-xs font-medium mt-2 mb-1">
        Pattern
      </label>
      <input
        id={`rule-${index}-pattern`}
        type="text"
        placeholder="^https://github\.com/.+/issues/"
        class="w-full px-2.5 py-2 text-sm font-mono border border-gray-300 rounded-md bg-white"
        {...register(patternKey)}
      />
      {patternError !== null && <div class="mt-1 text-red-700 text-xs">{patternError}</div>}
      <label for={`rule-${index}-template`} class="block text-xs font-medium mt-2 mb-1">
        Template
      </label>
      <input
        id={`rule-${index}-template`}
        type="text"
        placeholder="[{host}/{path[0]}]({url})"
        class="w-full px-2.5 py-2 text-sm font-mono border border-gray-300 rounded-md bg-white"
        {...register(templateKey)}
      />
      <pre class="preview mt-1 px-2.5 py-2 font-mono text-xs text-gray-900 bg-gray-100 border border-gray-200 rounded-md whitespace-pre-wrap break-all">
        {previewText}
      </pre>
    </div>
  );
}
