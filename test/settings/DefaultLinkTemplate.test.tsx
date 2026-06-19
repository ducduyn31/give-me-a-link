import { describe, expect, it } from 'bun:test';
import { fireEvent, screen } from '@testing-library/preact';

import DefaultLinkTemplate, {
  linkTemplateField,
} from '../../src/settings/sections/ClipboardTemplate/DefaultLinkTemplate';
import { PREVIEW_SAMPLE } from '../../src/settings/fields';
import { DEFAULT_LINK_TEMPLATE, formatLink } from '../../src/shared/format';
import { renderWithForm } from '../helpers/renderWithForm';

const SAMPLE_URL = PREVIEW_SAMPLE.url;
const SAMPLE_TITLE = PREVIEW_SAMPLE.title ?? '';

function getInput() {
  return screen.getByLabelText(linkTemplateField.label) as HTMLInputElement;
}

function previewText() {
  return document.querySelector('.preview')?.textContent?.trim() ?? '';
}

function typeTemplate(template: string) {
  fireEvent.input(getInput(), { target: { value: template } });
}

describe('DefaultLinkTemplate', () => {
  describe('initial render', () => {
    it('shows the field label', () => {
      renderWithForm(<DefaultLinkTemplate />);
      expect(screen.getByLabelText(linkTemplateField.label)).toBeTruthy();
    });

    it('shows the hint about available tokens', () => {
      renderWithForm(<DefaultLinkTemplate />);
      expect(screen.getByText(linkTemplateField.hint!)).toBeTruthy();
    });

    it('shows the preview source label', () => {
      renderWithForm(<DefaultLinkTemplate />);
      expect(screen.getByText(`Preview for ${SAMPLE_URL}`)).toBeTruthy();
    });

    it('shows the default template output in the preview', () => {
      renderWithForm(<DefaultLinkTemplate />);
      expect(previewText()).toBe(`[github.com/ducduyn31](${SAMPLE_URL})`);
    });

    it('is never disabled', () => {
      renderWithForm(<DefaultLinkTemplate />);
      expect(getInput()).not.toBeDisabled();
    });
  });

  describe('template token syntax', () => {
    describe('{host}', () => {
      it('renders the hostname with www. stripped', () => {
        renderWithForm(<DefaultLinkTemplate />);
        typeTemplate('{host}');
        expect(previewText()).toBe('github.com');
      });
    });

    describe('{path}', () => {
      it('renders the full pathname without query string or hash', () => {
        renderWithForm(<DefaultLinkTemplate />);
        typeTemplate('{path}');
        expect(previewText()).toBe('/ducduyn31/give-me-a-link/issues/12');
      });
    });

    describe('{path[n]}', () => {
      it('renders the first segment with {path[0]}', () => {
        renderWithForm(<DefaultLinkTemplate />);
        typeTemplate('{path[0]}');
        expect(previewText()).toBe('ducduyn31');
      });

      it('renders a deeper segment with {path[2]}', () => {
        renderWithForm(<DefaultLinkTemplate />);
        typeTemplate('{path[2]}');
        expect(previewText()).toBe('issues');
      });

      it('renders empty for an out-of-range index', () => {
        renderWithForm(<DefaultLinkTemplate />);
        typeTemplate('a{path[99]}b');
        expect(previewText()).toBe('ab');
      });
    });

    describe('{url}', () => {
      it('renders the full URL including query string and hash', () => {
        renderWithForm(<DefaultLinkTemplate />);
        typeTemplate('{url}');
        expect(previewText()).toBe(SAMPLE_URL);
      });
    });

    describe('{title}', () => {
      it('renders the page title', () => {
        renderWithForm(<DefaultLinkTemplate />);
        typeTemplate('{title}');
        expect(previewText()).toBe(SAMPLE_TITLE);
      });
    });

    describe('unknown token', () => {
      it('leaves unrecognised tokens as literal text', () => {
        renderWithForm(<DefaultLinkTemplate />);
        typeTemplate('{nope}-{host}');
        expect(previewText()).toBe('{nope}-github.com');
      });
    });

    describe('combining tokens', () => {
      it('builds a Markdown link with {title} and {url}', () => {
        renderWithForm(<DefaultLinkTemplate />);
        typeTemplate('[{title}]({url})');
        expect(previewText()).toBe(`[${SAMPLE_TITLE}](${SAMPLE_URL})`);
      });

      it('builds the default-style label using {host} and {path[0]}', () => {
        renderWithForm(<DefaultLinkTemplate />);
        typeTemplate('[{host}/{path[0]}]({url})');
        expect(previewText()).toBe(`[github.com/ducduyn31](${SAMPLE_URL})`);
      });

      it('mixes literal text with tokens', () => {
        renderWithForm(<DefaultLinkTemplate />);
        typeTemplate('via {host}: {title}');
        expect(previewText()).toBe(`via github.com: ${SAMPLE_TITLE}`);
      });
    });
  });

  describe('live preview', () => {
    it('updates immediately as the user types', () => {
      renderWithForm(<DefaultLinkTemplate />);
      typeTemplate('{title}');
      expect(previewText()).toBe(SAMPLE_TITLE);
    });

    it('reflects an initial value stored in settings', () => {
      renderWithForm(<DefaultLinkTemplate />, { linkTemplate: '[{title}]({url})' });
      expect(previewText()).toBe(`[${SAMPLE_TITLE}](${SAMPLE_URL})`);
    });

    it('falls back to the default template output when the input is cleared', () => {
      renderWithForm(<DefaultLinkTemplate />);
      typeTemplate('');
      expect(previewText()).toBe(formatLink(PREVIEW_SAMPLE, DEFAULT_LINK_TEMPLATE));
      expect(getInput().value).toBe('');
    });
  });
});
