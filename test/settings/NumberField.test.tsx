import { describe, expect, it } from 'bun:test';
import { screen } from '@testing-library/preact';
import NumberField from '../../src/settings/components/NumberField';
import { githubCompactPathMaxLenField } from '../../src/settings/sections/GithubExtension';
import { toastDurationMsField } from '../../src/settings/sections/ToastSettings';
import { renderWithForm } from '../helpers/renderWithForm';

describe('NumberField', () => {
  it('renders the label and input', () => {
    renderWithForm(<NumberField field={toastDurationMsField} />);
    expect(screen.getByLabelText(toastDurationMsField.label)).toBeTruthy();
  });

  it('applies min, max, and step attributes from the field definition', () => {
    renderWithForm(<NumberField field={toastDurationMsField} />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    expect(Number(input.min)).toBe(toastDurationMsField.min);
    expect(Number(input.max)).toBe(toastDurationMsField.max);
    expect(Number(input.step)).toBe(toastDurationMsField.step);
  });

  describe('when its dependency is disabled', () => {
    it('is disabled when toastEnabled is false', () => {
      renderWithForm(<NumberField field={toastDurationMsField} />, { toastEnabled: false });
      expect(screen.getByRole('spinbutton')).toBeDisabled();
    });
  });

  describe('when its dependency is enabled', () => {
    it('is enabled when toastEnabled is true', () => {
      renderWithForm(<NumberField field={toastDurationMsField} />, { toastEnabled: true });
      expect(screen.getByRole('spinbutton')).not.toBeDisabled();
    });

    it('is always enabled when it has no disabledWhen condition', () => {
      renderWithForm(<NumberField field={githubCompactPathMaxLenField} />);
      expect(screen.getByRole('spinbutton')).not.toBeDisabled();
    });
  });
});
