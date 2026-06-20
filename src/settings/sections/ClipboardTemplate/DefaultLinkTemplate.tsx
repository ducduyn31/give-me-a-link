import { DEFAULT_LINK_TEMPLATE, formatLink, parseLinkTemplate } from '@/shared/format';
import LivePreview from '../../components/LivePreview';
import TextField from '../../components/TextField';
import { PREVIEW_SAMPLE } from '../../fields';
import type { TextF } from '../../types';

export const linkTemplateField: TextF = {
  kind: 'text',
  key: 'linkTemplate',
  label: 'Clipboard template',
  hint:
    'Tokens: {host}, {path}, {path[0]} (or any non-negative index), {url}, {title}. ' +
    'Unknown {tokens} are left as-is. Empty value falls back to the default.',
  placeholder: DEFAULT_LINK_TEMPLATE,
  parse: parseLinkTemplate,
  preview: (template) => formatLink(PREVIEW_SAMPLE, template),
  previewSourceLabel: PREVIEW_SAMPLE.url,
};

export default function DefaultLinkTemplate() {
  return (
    <div class="mb-5">
      <TextField field={linkTemplateField} />
      <LivePreview field={linkTemplateField} />
    </div>
  );
}
