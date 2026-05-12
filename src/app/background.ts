import { formatLink } from '../shared/format';
import { loadSettings } from '../shared/settings';
import { copyAndNotify } from './inject/toast';

const COMMAND_NAME = 'copy-markdown-link';
const SUPPORTED_SCHEME = /^https?:/i;

chrome.commands.onCommand.addListener(async (command: string) => {
  if (command !== COMMAND_NAME) return;

  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tab?.url || tab.id === undefined) {
      console.warn('[give-me-a-link] no active tab URL');
      return;
    }
    if (!SUPPORTED_SCHEME.test(tab.url)) {
      console.warn('[give-me-a-link] unsupported URL scheme:', tab.url);
      return;
    }

    const settings = await loadSettings();
    const text = formatLink({ url: tab.url, title: tab.title }, settings.linkTemplate);

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: copyAndNotify,
      args: [{ text, toastEnabled: settings.toastEnabled, durationMs: settings.toastDurationMs }],
    });
  } catch (err) {
    console.warn('[give-me-a-link] failed:', err);
  }
});
