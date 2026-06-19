import { afterEach, beforeEach, describe, expect, it, jest } from 'bun:test';
import { act, fireEvent, screen } from '@testing-library/preact';
import CustomRulesTemplate, {
  conditionalFormatsField,
} from '../../src/settings/sections/ClipboardTemplate/CustomRulesTemplate';
import { renderWithForm } from '../helpers/renderWithForm';

const DEBOUNCE_MS = 300;

function getTestUrlInput() {
  return screen.getByPlaceholderText(/github\.com\/foo/) as HTMLInputElement;
}

function typeTestUrl(url: string) {
  fireEvent.input(getTestUrlInput(), { target: { value: url } });
}

function advanceDebounce() {
  act(() => {
    jest.advanceTimersByTime(DEBOUNCE_MS);
  });
}

describe('CustomRulesTemplate', () => {
  describe('initial render', () => {
    it('shows the "Conditional formats" label', () => {
      renderWithForm(<CustomRulesTemplate />);
      expect(screen.getByText(conditionalFormatsField.label)).toBeTruthy();
    });

    it('shows the hint text', () => {
      renderWithForm(<CustomRulesTemplate />);
      expect(screen.getByText(conditionalFormatsField.hint!)).toBeTruthy();
    });

    it('shows the Test URL label', () => {
      renderWithForm(<CustomRulesTemplate />);
      expect(screen.getByText('Test URL')).toBeTruthy();
    });

    it('shows the Test URL input empty', () => {
      renderWithForm(<CustomRulesTemplate />);
      expect(getTestUrlInput().value).toBe('');
    });

    it('renders no rules when conditional formats is empty', () => {
      renderWithForm(<CustomRulesTemplate />, { conditionalFormats: [] });
      expect(screen.queryByText(/Rule \d/)).toBeNull();
    });

    it('renders one row per initial rule', () => {
      renderWithForm(<CustomRulesTemplate />, {
        conditionalFormats: [
          { pattern: '^https://a\\.com/', template: '[A]({url})' },
          { pattern: '^https://b\\.com/', template: '[B]({url})' },
        ],
      });
      expect(screen.getByText('Rule 1')).toBeTruthy();
      expect(screen.getByText('Rule 2')).toBeTruthy();
    });
  });

  describe('Test URL input', () => {
    it('reflects what the user types', () => {
      renderWithForm(<CustomRulesTemplate />);
      typeTestUrl('https://github.com/foo');
      expect(getTestUrlInput().value).toBe('https://github.com/foo');
    });
  });

  describe('rule matching via debounced Test URL', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('does not highlight any rule immediately before the debounce fires', () => {
      renderWithForm(<CustomRulesTemplate />, {
        conditionalFormats: [{ pattern: '^https://github\\.com/', template: '[G]({url})' }],
      });
      typeTestUrl('https://github.com/foo');
      expect(document.querySelector('.rule--matched')).toBeNull();
    });

    it('highlights the matching rule after the debounce delay', () => {
      renderWithForm(<CustomRulesTemplate />, {
        conditionalFormats: [{ pattern: '^https://github\\.com/', template: '[G]({url})' }],
      });
      typeTestUrl('https://github.com/foo');
      advanceDebounce();
      expect(document.querySelector('.rule--matched')).toBeTruthy();
    });

    it('only highlights the first rule whose pattern matches (first-match-wins)', () => {
      renderWithForm(<CustomRulesTemplate />, {
        conditionalFormats: [
          { pattern: '^https://github\\.com/', template: '[G]({url})' },
          { pattern: '^https://', template: '[all]({url})' },
        ],
      });
      typeTestUrl('https://github.com/foo');
      advanceDebounce();
      const rules = document.querySelectorAll('.rule');
      expect(rules[0]).toHaveClass('rule--matched');
      expect(rules[1]).not.toHaveClass('rule--matched');
    });

    it('shows no highlight when the URL does not match any rule', () => {
      renderWithForm(<CustomRulesTemplate />, {
        conditionalFormats: [{ pattern: '^https://github\\.com/', template: '[G]({url})' }],
      });
      typeTestUrl('https://example.com/foo');
      advanceDebounce();
      expect(document.querySelector('.rule--matched')).toBeNull();
    });

    it('removes the highlight when the input is cleared', () => {
      renderWithForm(<CustomRulesTemplate />, {
        conditionalFormats: [{ pattern: '^https://github\\.com/', template: '[G]({url})' }],
      });
      typeTestUrl('https://github.com/foo');
      advanceDebounce();
      typeTestUrl('');
      advanceDebounce();
      expect(document.querySelector('.rule--matched')).toBeNull();
    });

    it('shows no highlight before any URL is typed', () => {
      renderWithForm(<CustomRulesTemplate />, {
        conditionalFormats: [{ pattern: '^https://github\\.com/', template: '[G]({url})' }],
      });
      expect(document.querySelector('.rule--matched')).toBeNull();
    });
  });

  describe('rule ordering', () => {
    function getPatternInputs() {
      return screen.queryAllByPlaceholderText(/\^https:/) as HTMLInputElement[];
    }

    it('"Move up" swaps a rule with the one above it', () => {
      renderWithForm(<CustomRulesTemplate />, {
        conditionalFormats: [
          { pattern: '^https://a\\.com/', template: '[A]({url})' },
          { pattern: '^https://b\\.com/', template: '[B]({url})' },
        ],
      });
      fireEvent.click(screen.getAllByTitle('Move up')[1]);
      const inputs = getPatternInputs();
      expect(inputs[0].value).toBe('^https://b\\.com/');
      expect(inputs[1].value).toBe('^https://a\\.com/');
    });

    it('"Move down" swaps a rule with the one below it', () => {
      renderWithForm(<CustomRulesTemplate />, {
        conditionalFormats: [
          { pattern: '^https://a\\.com/', template: '[A]({url})' },
          { pattern: '^https://b\\.com/', template: '[B]({url})' },
        ],
      });
      fireEvent.click(screen.getAllByTitle('Move down')[0]);
      const inputs = getPatternInputs();
      expect(inputs[0].value).toBe('^https://b\\.com/');
      expect(inputs[1].value).toBe('^https://a\\.com/');
    });

    it('"Move up" is disabled for the first rule', () => {
      renderWithForm(<CustomRulesTemplate />, {
        conditionalFormats: [
          { pattern: '^https://a\\.com/', template: '[A]({url})' },
          { pattern: '^https://b\\.com/', template: '[B]({url})' },
        ],
      });
      expect(screen.getAllByTitle('Move up')[0]).toBeDisabled();
    });

    it('"Move down" is disabled for the last rule', () => {
      renderWithForm(<CustomRulesTemplate />, {
        conditionalFormats: [
          { pattern: '^https://a\\.com/', template: '[A]({url})' },
          { pattern: '^https://b\\.com/', template: '[B]({url})' },
        ],
      });
      const moveDownButtons = screen.getAllByTitle('Move down');
      expect(moveDownButtons[moveDownButtons.length - 1]).toBeDisabled();
    });

    it('matching follows the new order after reordering', () => {
      jest.useFakeTimers();
      renderWithForm(<CustomRulesTemplate />, {
        conditionalFormats: [
          { pattern: '^https://a\\.com/', template: '[A]({url})' },
          { pattern: '^https://github\\.com/', template: '[G]({url})' },
        ],
      });
      typeTestUrl('https://github.com/foo');
      advanceDebounce();

      // Rule 2 matches before reorder
      const rulesBefore = document.querySelectorAll('.rule');
      expect(rulesBefore[0]).not.toHaveClass('rule--matched');
      expect(rulesBefore[1]).toHaveClass('rule--matched');

      // Move rule 2 up
      fireEvent.click(screen.getAllByTitle('Move up')[1]);

      const rulesAfter = document.querySelectorAll('.rule');
      expect(rulesAfter[0]).toHaveClass('rule--matched');
      expect(rulesAfter[1]).not.toHaveClass('rule--matched');

      jest.useRealTimers();
    });
  });

  describe('"Add rule" button', () => {
    it('appends a new empty rule row', () => {
      renderWithForm(<CustomRulesTemplate />, { conditionalFormats: [] });
      fireEvent.click(screen.getByText('+ Add rule'));
      expect(screen.getByText('Rule 1')).toBeTruthy();
    });
  });
});
