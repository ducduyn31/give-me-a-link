import { useState } from 'preact/hooks';
import { useDebounceValue } from 'usehooks-ts';
import { formatLink, parseConditionalFormats, type LinkSource } from '../../../../shared/format';
import RuleList from './RuleList';
import { PREVIEW_SAMPLE } from '../../../fields';
import type { RulesF } from '../../../types';

export const conditionalFormatsField: RulesF = {
  kind: 'rules',
  key: 'conditionalFormats',
  label: 'Conditional formats',
  hint:
    'Apply a different template when the URL matches a regex. The first matching rule wins; ' +
    'otherwise the clipboard template above is used. Type a URL into "Test URL" to see which ' +
    'rule would apply.',
  parse: parseConditionalFormats,
  preview: (template: string, source: LinkSource) => formatLink(source, template),
  defaultSample: PREVIEW_SAMPLE,
};

export default function CustomRulesTemplate() {
  const [testUrl, setTestUrl] = useState('');
  const [debouncedTestUrl] = useDebounceValue(testUrl, 300);

  return (
    <div class="mb-5">
      <label class="block font-semibold mb-1.5 text-sm">{conditionalFormatsField.label}</label>
      {conditionalFormatsField.hint && (
        <div class="text-gray-500 text-xs mt-1">{conditionalFormatsField.hint}</div>
      )}
      <div class="my-3">
        <label for="test-url" class="block font-medium text-xs text-gray-500 mb-1">
          Test URL
        </label>
        <input
          type="text"
          id="test-url"
          placeholder="https://github.com/foo/bar/issues/1"
          value={testUrl}
          class="w-full px-2.5 py-2 text-sm font-mono border border-gray-300 rounded-md bg-white"
          onInput={(e) => setTestUrl(e.currentTarget.value)}
        />
      </div>
      <RuleList field={conditionalFormatsField} testUrl={debouncedTestUrl} />
    </div>
  );
}
