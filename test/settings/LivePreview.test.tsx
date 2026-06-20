import { describe, expect, it } from 'bun:test';
import { fireEvent, screen } from '@testing-library/preact';

import LivePreview from '../../src/settings/components/LivePreview';
import TextField from '../../src/settings/components/TextField';
import { PREVIEW_SAMPLE } from '../../src/settings/fields';
import { linkTemplateField } from '../../src/settings/sections/ClipboardTemplate/DefaultLinkTemplate';
import { renderWithForm } from '../helpers/renderWithForm';
import type { Settings } from '../../src/shared/settings';

function renderBoth(overrides?: Partial<Settings>) {
  return renderWithForm(
    <>
      <TextField field={linkTemplateField} />
      <LivePreview field={linkTemplateField} />
    </>,
    overrides,
  );
}

describe('LivePreview', () => {
  it('renders a preview element', () => {
    renderBoth();
    expect(document.querySelector('.preview')).not.toBeNull();
  });

  it('renders the preview source label', () => {
    renderBoth();
    expect(screen.getByText(`Preview for ${linkTemplateField.previewSourceLabel!}`)).toBeTruthy();
  });

  describe('preview output', () => {
    it('reflects the stored initial value', () => {
      const customTemplate = '[{title}]({url})';
      renderBoth({ linkTemplate: customTemplate });
      const expected = `[${PREVIEW_SAMPLE.title ?? ''}](${PREVIEW_SAMPLE.url})`;
      expect(document.querySelector('.preview')?.textContent?.trim()).toBe(expected);
    });

    it('updates live as the user types', () => {
      renderBoth();
      const input = screen.getByLabelText(linkTemplateField.label) as HTMLInputElement;
      fireEvent.input(input, { target: { value: '{title}' } });
      expect(document.querySelector('.preview')?.textContent?.trim()).toBe(
        PREVIEW_SAMPLE.title ?? '',
      );
    });

    it('falls back to the default template output when the input is cleared', () => {
      renderBoth();
      const input = screen.getByLabelText(linkTemplateField.label) as HTMLInputElement;
      fireEvent.input(input, { target: { value: '' } });
      expect(document.querySelector('.preview')?.textContent?.trim()).not.toBe('');
      expect(input.value).toBe('');
    });
  });
});
