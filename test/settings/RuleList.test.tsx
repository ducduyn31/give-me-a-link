import { describe, expect, it } from 'bun:test';
import { fireEvent, screen } from '@testing-library/preact';
import RuleList from '../../src/settings/sections/ClipboardTemplate/CustomRulesTemplate/RuleList';
import { conditionalFormatsField } from '../../src/settings/sections/ClipboardTemplate/CustomRulesTemplate';
import { renderWithForm } from '../helpers/renderWithForm';

function getPatternInputs() {
  return screen.queryAllByPlaceholderText(/github\\\.com/);
}

describe('RuleList', () => {
  describe('with no initial rules', () => {
    it('renders no rule rows', () => {
      renderWithForm(<RuleList field={conditionalFormatsField} testUrl="" />, {
        conditionalFormats: [],
      });
      expect(getPatternInputs()).toHaveLength(0);
    });
  });

  describe('with initial rules', () => {
    it('renders one row per rule', () => {
      renderWithForm(<RuleList field={conditionalFormatsField} testUrl="" />, {
        conditionalFormats: [
          { pattern: '^https://a\\.com/', template: '[A]({url})' },
          { pattern: '^https://b\\.com/', template: '[B]({url})' },
        ],
      });
      expect(getPatternInputs()).toHaveLength(2);
      expect(screen.getByText('Rule 1')).toBeTruthy();
      expect(screen.getByText('Rule 2')).toBeTruthy();
    });
  });

  describe('"Add rule" button', () => {
    it('appends a new empty row', () => {
      renderWithForm(<RuleList field={conditionalFormatsField} testUrl="" />, {
        conditionalFormats: [],
      });
      fireEvent.click(screen.getByText('+ Add rule'));
      expect(getPatternInputs()).toHaveLength(1);
      expect(screen.getByText('Rule 1')).toBeTruthy();
    });
  });

  describe('"Remove" button', () => {
    it('deletes the row and renumbers the remaining ones', () => {
      renderWithForm(<RuleList field={conditionalFormatsField} testUrl="" />, {
        conditionalFormats: [
          { pattern: '^https://a\\.com/', template: '[A]({url})' },
          { pattern: '^https://b\\.com/', template: '[B]({url})' },
        ],
      });

      fireEvent.click(screen.getAllByText('Remove')[0]);

      expect(getPatternInputs()).toHaveLength(1);
      expect(screen.queryByText('Rule 2')).toBeNull();
      expect(screen.getByText('Rule 1')).toBeTruthy();
    });
  });

  describe('pattern validation', () => {
    it('shows an error for an invalid regex', async () => {
      renderWithForm(<RuleList field={conditionalFormatsField} testUrl="" />, {
        conditionalFormats: [{ pattern: '', template: '' }],
      });
      fireEvent.input(getPatternInputs()[0], { target: { value: '[unclosed' } });
      expect(await screen.findByText(/Invalid regex/)).toBeTruthy();
    });

    it('shows no error for a valid regex', () => {
      renderWithForm(<RuleList field={conditionalFormatsField} testUrl="" />, {
        conditionalFormats: [{ pattern: '^https://github\\.com/', template: '[G]({url})' }],
      });
      expect(screen.queryByText(/Invalid regex/)).toBeNull();
    });
  });

  describe('test URL matching', () => {
    it('highlights the first rule whose pattern matches', () => {
      renderWithForm(
        <RuleList field={conditionalFormatsField} testUrl="https://github.com/foo" />,
        {
          conditionalFormats: [
            { pattern: '^https://github\\.com/', template: '[G]({url})' },
            { pattern: '^https://', template: '[all]({url})' },
          ],
        },
      );

      const rules = document.querySelectorAll('.rule');
      expect(rules[0]).toHaveClass('rule--matched');
      expect(rules[1]).not.toHaveClass('rule--matched');
    });

    it('shows no highlight when the test URL is empty', () => {
      renderWithForm(<RuleList field={conditionalFormatsField} testUrl="" />, {
        conditionalFormats: [{ pattern: '^https://github\\.com/', template: '[G]({url})' }],
      });

      expect(document.querySelector('.rule--matched')).toBeNull();
    });
  });

  describe('"Move up" button', () => {
    it('swaps the row with the one above it', () => {
      renderWithForm(<RuleList field={conditionalFormatsField} testUrl="" />, {
        conditionalFormats: [
          { pattern: '^https://a\\.com/', template: '[A]({url})' },
          { pattern: '^https://b\\.com/', template: '[B]({url})' },
        ],
      });

      fireEvent.click(screen.getAllByTitle('Move up')[1]);

      const inputs = getPatternInputs() as HTMLInputElement[];
      expect(inputs[0].value).toBe('^https://b\\.com/');
      expect(inputs[1].value).toBe('^https://a\\.com/');
    });
  });
});
