import { formatLink, pickTemplate } from '../shared/format';
import { loadSettings } from '../shared/settings';
import { copyAndNotify, notifyOnly } from './inject/toast';

const COMMAND_NAME = 'copy-markdown-link';
const SUPPORTED_SCHEME = /^https?:/i;
const OFFSCREEN_PATH = 'offscreen.html';

interface OffscreenCopyResponse {
  ok: boolean;
  error?: string;
}

// Chromium-only: use an offscreen document so the clipboard write runs in an
// extension page rather than the target tab. This sidesteps the
// document-focus / user-activation errors thrown by navigator.clipboard
// when DevTools or the address bar has focus at command time.
function offscreenAvailable(): boolean {
  return typeof chrome !== 'undefined' && typeof chrome.offscreen !== 'undefined';
}

async function ensureOffscreenDocument(): Promise<void> {
  try {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_PATH,
      reasons: ['CLIPBOARD'],
      justification: 'Write the formatted link to the system clipboard.',
    });
  } catch (err) {
    // "Only a single offscreen document may be created" is the expected
    // error when one already exists from a previous command. Anything else
    // is fatal — re-throw so the caller surfaces it.
    if (!String(err instanceof Error ? err.message : err).includes('single offscreen document')) {
      throw err;
    }
  }
}

async function copyViaOffscreen(text: string): Promise<OffscreenCopyResponse> {
  await ensureOffscreenDocument();
  const response = (await chrome.runtime.sendMessage({
    target: 'offscreen-clipboard',
    text,
  })) as OffscreenCopyResponse | undefined;
  return response ?? { ok: false, error: 'no response from offscreen document' };
}

// Core copy flow, shared by the keyboard command and the toolbar-button click.
// Both need an active tab with a copyable URL; they differ only in how they
// obtain that tab (commands query for it, action.onClicked hands it over).
async function copyForTab(tab: chrome.tabs.Tab | undefined): Promise<void> {
  if (!tab?.url || tab.id === undefined) {
    console.warn('[give-me-a-link] no active tab URL');
    return;
  }
  if (!SUPPORTED_SCHEME.test(tab.url)) {
    console.warn('[give-me-a-link] unsupported URL scheme:', tab.url);
    return;
  }

  const settings = await loadSettings();
  const template = pickTemplate(tab.url, settings.conditionalFormats, settings.linkTemplate);
  const text = formatLink({ url: tab.url, title: tab.title }, template);

  if (offscreenAvailable()) {
    let result: OffscreenCopyResponse;
    try {
      result = await copyViaOffscreen(text);
    } catch (err) {
      result = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
    if (result.ok) {
      if (settings.toastEnabled) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: notifyOnly,
          args: [
            {
              kind: 'success',
              title: 'Copied',
              body: text,
              durationMs: settings.toastDurationMs,
            },
          ],
        });
      }
      return;
    }
    // Offscreen path failed (e.g. some Chrome versions block execCommand
    // there). Fall through to the in-page copy: it can fail when DevTools
    // owns focus, but it usually doesn't, so it's a useful last resort —
    // and copyAndNotify already renders an error toast itself if it can't
    // write either.
    console.warn('[give-me-a-link] offscreen copy failed, falling back to in-page:', result.error);
  }

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: copyAndNotify,
    args: [{ text, toastEnabled: settings.toastEnabled, durationMs: settings.toastDurationMs }],
  });
}

chrome.commands.onCommand.addListener(async (command: string) => {
  if (command !== COMMAND_NAME) return;
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    await copyForTab(tab);
  } catch (err) {
    console.error('[give-me-a-link] failed:', err);
  }
});

// Toolbar-button click. This is the primary trigger in browsers that don't
// deliver extension `commands` keyboard shortcuts — notably Arc, where the
// Cmd+./Ctrl+. command never fires. onClicked hands us the active tab directly,
// with a fresh user gesture. Requires the manifest `action` to have no
// `default_popup`, otherwise the popup opens instead of firing this listener.
chrome.action.onClicked.addListener(async (tab) => {
  try {
    await copyForTab(tab);
  } catch (err) {
    console.error('[give-me-a-link] failed:', err);
  }
});
