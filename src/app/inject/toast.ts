// `copyAndNotify` is executed via chrome.scripting.executeScript({ func }), which
// serializes the function with `.toString()`. Any reference to an outer-scope
// identifier would throw in the target page, so it stays fully self-contained.
// `showToast` is a regular exported helper for callers that already run in the
// page (content scripts), where normal bundling/imports apply.

export type ToastKind = 'success' | 'error';

export interface CopyAndNotifyArgs {
  text: string;
  toastEnabled: boolean;
  durationMs: number;
}

export function showToast(kind: ToastKind, title: string, body: string, durationMs: number): void {
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
}

export function copyAndNotify(args: CopyAndNotifyArgs): void {
  const { text, toastEnabled, durationMs } = args;

  const showToastInline = (kind: 'success' | 'error', title: string, body: string): void => {
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
    () => showToastInline('success', 'Copied', text),
    (err: unknown) => {
      console.warn('[give-me-a-link] clipboard write failed:', err);
      showToastInline('error', 'Copy failed', String(err instanceof Error ? err.message : err));
    },
  );
}
