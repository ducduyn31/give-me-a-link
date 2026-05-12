// Executed via chrome.scripting.executeScript({ func }) in the active tab.
// Must be fully self-contained — Chrome serializes the function via
// `.toString()`, so any reference to an outer-scope identifier will throw at
// runtime in the target page.

export type ToastKind = 'success' | 'error';

export interface CopyAndNotifyArgs {
  text: string;
  toastEnabled: boolean;
  durationMs: number;
}

export function copyAndNotify(args: CopyAndNotifyArgs): void {
  const { text, toastEnabled, durationMs } = args;

  const showToast = (kind: 'success' | 'error', title: string, body: string): void => {
    if (!toastEnabled) return;

    const TOAST_ID = '__md_link_toast__';
    document.getElementById(TOAST_ID)?.remove();

    const palette =
      kind === 'success'
        ? { bg: 'rgba(28, 28, 30, 0.96)', fg: '#fff' }
        : { bg: 'rgba(190, 30, 30, 0.96)', fg: '#fff' };

    const toast = document.createElement('div');
    toast.id = TOAST_ID;
    toast.style.cssText = [
      'all: initial',
      'position: fixed',
      'bottom: 16px',
      'right: 16px',
      'z-index: 2147483647',
      `background: ${palette.bg}`,
      `color: ${palette.fg}`,
      'font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'padding: 10px 12px',
      'border-radius: 8px',
      'box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25)',
      'max-width: 360px',
      'pointer-events: none',
      'opacity: 0',
      'transition: opacity 120ms ease',
    ].join(';');

    const titleEl = document.createElement('div');
    titleEl.textContent = title;
    titleEl.style.cssText = `font-weight: 600; margin-bottom: 2px; color: ${palette.fg};`;

    const bodyEl = document.createElement('div');
    bodyEl.textContent = body;
    bodyEl.style.cssText = `opacity: 0.85; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: ${palette.fg};`;

    toast.appendChild(titleEl);
    toast.appendChild(bodyEl);
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 200);
    }, durationMs);
  };

  navigator.clipboard.writeText(text).then(
    () => showToast('success', 'Copied', text),
    (err: unknown) => {
      console.warn('[give-me-a-link] clipboard write failed:', err);
      showToast('error', 'Copy failed', String(err instanceof Error ? err.message : err));
    },
  );
}
