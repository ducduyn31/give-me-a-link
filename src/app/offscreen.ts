// Offscreen document — exists solely so the service worker can copy text to the
// clipboard via an extension page. Extension pages inherit the user activation
// granted to the service worker by chrome.commands.onCommand, so this path is
// not subject to the page-focus / user-activation restrictions that trip up
// chrome.scripting.executeScript + navigator.clipboard.writeText.

interface CopyMessage {
  target: 'offscreen-clipboard';
  text: string;
}

function isCopyMessage(value: unknown): value is CopyMessage {
  if (typeof value !== 'object' || value === null) return false;
  const m = value as Record<string, unknown>;
  return m.target === 'offscreen-clipboard' && typeof m.text === 'string';
}

// textarea + document.execCommand('copy'). Mirrors the chrome-extensions-samples
// offscreen-clipboard recipe exactly: set value, select, exec. Do NOT call
// .focus() — offscreen documents can never receive window focus, and calling
// focus() on the textarea changes the activeElement in a way that causes
// execCommand to return false on some Chrome versions. navigator.clipboard
// is intentionally not used here: it requires document focus and always
// rejects from an offscreen document.
function copyViaTextarea(text: string): { ok: true } | { ok: false; error: string } {
  const ta = document.getElementById('sink') as HTMLTextAreaElement | null;
  if (!ta) return { ok: false, error: 'offscreen textarea missing' };
  ta.value = text;
  ta.select();
  try {
    const ok = document.execCommand('copy');
    return ok ? { ok: true } : { ok: false, error: "execCommand('copy') returned false" };
  } catch (err) {
    return { ok: false, error: String(err instanceof Error ? err.message : err) };
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isCopyMessage(message)) return;

  const result = copyViaTextarea(message.text);
  if (!result.ok) {
    console.warn('[give-me-a-link] offscreen copy failed', result.error);
  }
  sendResponse(result);
});
