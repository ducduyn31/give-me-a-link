import { beforeEach, describe, expect, it } from 'bun:test';
import { formatLink, pickTemplate } from '../src/shared/format';
import { DEFAULTS, loadSettings } from '../src/shared/settings';

async function resolveClipboardText(url: string, title?: string): Promise<string> {
  const settings = await loadSettings();
  const template = pickTemplate(url, settings.conditionalFormats, settings.linkTemplate);
  return formatLink({ url, title }, template);
}

describe('Clipboard output', () => {
  beforeEach(async () => {
    await chrome.storage.local.set({ ...DEFAULTS });
  });

  describe('with default settings', () => {
    it('formats as [host/path[0]](url) for a typical URL', async () => {
      const text = await resolveClipboardText('https://docs.example.com/getting-started');
      expect(text).toBe(
        '[docs.example.com/getting-started](https://docs.example.com/getting-started)',
      );
    });

    it('strips www. from the host', async () => {
      const text = await resolveClipboardText('https://www.google.com/search?q=foo');
      expect(text).toBe('[google.com/search](https://www.google.com/search?q=foo)');
    });

    it('works when the title is provided (default template does not use {title})', async () => {
      const text = await resolveClipboardText('https://github.com/foo/bar', 'foo/bar · GitHub');
      expect(text).toBe('[github.com/foo](https://github.com/foo/bar)');
    });
  });

  describe('with a custom link template', () => {
    it('uses {title} when stored in the template', async () => {
      await chrome.storage.local.set({ linkTemplate: '[{title}]({url})' });
      const text = await resolveClipboardText('https://github.com/foo/bar', 'foo/bar · GitHub');
      expect(text).toBe('[foo/bar · GitHub](https://github.com/foo/bar)');
    });

    it('uses {host} and {title} together', async () => {
      await chrome.storage.local.set({ linkTemplate: '{host} — {title}' });
      const text = await resolveClipboardText('https://example.com/page', 'My Page');
      expect(text).toBe('example.com — My Page');
    });

    it('falls back to the default template when an empty string is stored', async () => {
      await chrome.storage.local.set({ linkTemplate: '' });
      const text = await resolveClipboardText('https://example.com/docs');
      // parseLinkTemplate('') → DEFAULT_LINK_TEMPLATE
      expect(text).toBe('[example.com/docs](https://example.com/docs)');
    });
  });

  describe('with conditional formats', () => {
    it('uses the matching rule instead of the global template', async () => {
      await chrome.storage.local.set({
        linkTemplate: '[{host}/{path[0]}]({url})',
        conditionalFormats: [{ pattern: '^https://github\\.com/', template: '[{title}]({url})' }],
      });
      const text = await resolveClipboardText('https://github.com/foo/bar', 'foo/bar · GitHub');
      expect(text).toBe('[foo/bar · GitHub](https://github.com/foo/bar)');
    });

    it('falls back to the global template when no rule matches', async () => {
      await chrome.storage.local.set({
        linkTemplate: '[custom: {host}]({url})',
        conditionalFormats: [{ pattern: '^https://github\\.com/', template: '[{title}]({url})' }],
      });
      const text = await resolveClipboardText('https://example.com');
      expect(text).toBe('[custom: example.com](https://example.com/)');
    });

    it('applies the first matching rule and ignores later ones', async () => {
      await chrome.storage.local.set({
        conditionalFormats: [
          { pattern: '^https://github\\.com/foo', template: 'first: {url}' },
          { pattern: '^https://github\\.com/', template: 'second: {url}' },
        ],
      });
      const text = await resolveClipboardText('https://github.com/foo/bar');
      expect(text).toBe('first: https://github.com/foo/bar');
    });

    it('skips a rule with an invalid regex and tries subsequent rules', async () => {
      await chrome.storage.local.set({
        conditionalFormats: [
          { pattern: '[unclosed', template: 'bad: {url}' },
          { pattern: '^https://github\\.com/', template: 'good: {url}' },
        ],
      });
      const text = await resolveClipboardText('https://github.com/foo');
      expect(text).toBe('good: https://github.com/foo');
    });

    it('falls back to the global template when all rules have invalid regex', async () => {
      await chrome.storage.local.set({
        linkTemplate: 'fallback: {url}',
        conditionalFormats: [
          { pattern: '[bad1', template: 'nope: {url}' },
          { pattern: '(bad2', template: 'nope: {url}' },
        ],
      });
      const text = await resolveClipboardText('https://example.com');
      expect(text).toBe('fallback: https://example.com/');
    });
  });
});
