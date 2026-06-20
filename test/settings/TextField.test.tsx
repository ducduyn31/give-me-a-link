import { describe, expect, it } from 'bun:test';
import { screen } from '@testing-library/preact';

import TextField from '../../src/settings/components/TextField';
import { linkTemplateField } from '../../src/settings/sections/ClipboardTemplate/DefaultLinkTemplate';
import { renderWithForm } from '../helpers/renderWithForm';

describe('TextField', () => {
  it('renders the label and input', () => {
    renderWithForm(<TextField field={linkTemplateField} />);
    expect(screen.getByLabelText(linkTemplateField.label)).toBeTruthy();
  });

  it('does not render a preview element', () => {
    renderWithForm(<TextField field={linkTemplateField} />);
    expect(document.querySelector('.preview')).toBeNull();
  });
});
