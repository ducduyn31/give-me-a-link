import {
  clampCompactPathMaxLen,
  DEFAULT_GITHUB_COMPACT_PATH_MAX_LEN,
  DEFAULT_GITHUB_LINK_TEMPLATE,
  formatGithubLink,
  parseGithubLinkTemplate,
} from '@/shared/format';
import LivePreview from '../components/LivePreview';
import NumberField from '../components/NumberField';
import TextField from '../components/TextField';
import { PREVIEW_GITHUB_SAMPLE } from '../fields';
import type { NumberF, TextF } from '../types';

export const githubLinkTemplateField: TextF = {
  kind: 'text',
  key: 'githubLinkTemplate',
  label: 'GitHub line-link template',
  hint:
    'Used by the "Copy as Markdown link" item injected into GitHub\'s blob-page selection menu. ' +
    'Tokens: {owner}, {repo}, {ref}, {filepath}, {compactFilepath}, {lines}, {url}, {title}. ' +
    'Unknown {tokens} are left as-is. Empty value falls back to the default.',
  placeholder: DEFAULT_GITHUB_LINK_TEMPLATE,
  parse: parseGithubLinkTemplate,
  preview: (template) =>
    formatGithubLink(PREVIEW_GITHUB_SAMPLE, template, {
      compactPathMaxLen: DEFAULT_GITHUB_COMPACT_PATH_MAX_LEN,
    }),
  previewSourceLabel: PREVIEW_GITHUB_SAMPLE.url,
};

export const githubCompactPathMaxLenField: NumberF = {
  kind: 'number',
  key: 'githubCompactPathMaxLen',
  label: 'GitHub compact path threshold (chars)',
  hint:
    'When {compactFilepath} is used, paths longer than this collapse middle segments with "…". ' +
    'Between 10 and 200.',
  min: 10,
  max: 200,
  step: 1,
  parse: clampCompactPathMaxLen,
};

export default function GithubExtension() {
  return (
    <>
      <div class="mb-5">
        <TextField field={githubLinkTemplateField} />
        <LivePreview field={githubLinkTemplateField} />
      </div>
      <NumberField field={githubCompactPathMaxLenField} />
    </>
  );
}
