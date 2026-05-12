// Content script injected into GitHub blob pages. Watches for the
// line-selection "•••" popover and appends a "Copy as Markdown link" entry
// at the bottom of it.

import { type GithubLinkSource, formatGithubLink } from '../../shared/format';
import { loadSettings } from '../../shared/settings';
import { showToast } from '../inject/toast';

const COPY_PERMALINK_LABEL = 'Copy permalink';
const NEW_ITEM_LABEL = 'Copy as Markdown link';
const INJECTED_FLAG = 'data-gmal-injected';

const BLOB_PATH = /^\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/;
const LINES_HASH = /^#L(\d+)(?:-L(\d+))?$/;

const handledMenus = new WeakSet<Element>();

// --- URL parsing -----------------------------------------------------------

function parseBlobLocation(href: string): GithubLinkSource | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  const path = BLOB_PATH.exec(url.pathname);
  if (!path) return null;
  const lines = LINES_HASH.exec(url.hash);
  return {
    url: url.toString(),
    owner: path[1],
    repo: path[2],
    ref: path[3],
    filepath: path[4],
    startLine: lines ? Number(lines[1]) : undefined,
    endLine: lines?.[2] ? Number(lines[2]) : undefined,
    title: document.title,
  };
}

function isBlobPage(): boolean {
  return BLOB_PATH.test(window.location.pathname);
}

// --- DOM extraction --------------------------------------------------------

function findMenuItem(menu: Element, label: string): HTMLElement | null {
  for (const item of menu.querySelectorAll<HTMLElement>('[role="menuitem"]')) {
    if ((item.textContent ?? '').trim() === label) return item;
  }
  return null;
}

function getPermalinkHref(copyPermalink: HTMLElement): string | null {
  const anchor =
    copyPermalink instanceof HTMLAnchorElement
      ? copyPermalink
      : copyPermalink.querySelector<HTMLAnchorElement>('a[href]');
  return anchor?.href ?? null;
}

function getCurrentCommitSha(): string | null {
  return (
    document.querySelector<HTMLMetaElement>(
      'meta[name="octolytics-dimension-commit_id"], meta[name="commit-sha"]',
    )?.content ?? null
  );
}

function pinShaInUrl(url: string, sha: string): string {
  const u = new URL(url);
  const parts = u.pathname.split('/');
  if (parts[3] === 'blob' && parts[4]) {
    parts[4] = sha;
    u.pathname = parts.join('/');
  }
  return u.toString();
}

// Prefer the "Copy permalink" anchor's href (already SHA-pinned by GitHub);
// fall back to substituting the page-level commit SHA into the current URL.
function buildSource(copyPermalink: HTMLElement): GithubLinkSource | null {
  let permalink = getPermalinkHref(copyPermalink);
  if (!permalink) {
    const sha = getCurrentCommitSha();
    permalink = sha ? pinShaInUrl(window.location.href, sha) : window.location.href;
  }
  return parseBlobLocation(permalink);
}

// --- Item construction -----------------------------------------------------

// Replace the first non-empty text node with `label` and clear the rest,
// preserving any leading <svg> icon markup.
function setLabel(root: HTMLElement, label: string): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let assigned = false;
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n as Text;
    if (!(text.nodeValue ?? '').trim()) continue;
    text.nodeValue = assigned ? '' : label;
    assigned = true;
  }
  if (!assigned) root.appendChild(document.createTextNode(label));
}

// Clone the existing menu entry so the new one inherits GitHub's Primer
// classes and hover styles. cloneNode drops addEventListener handlers, so the
// clone is inert until we wire our own.
function cloneEntry(
  original: HTMLElement,
  list: Element,
): { wrapper: HTMLElement; item: HTMLElement } | null {
  let wrapper: HTMLElement = original;
  while (wrapper.parentElement && wrapper.parentElement !== list) {
    wrapper = wrapper.parentElement;
  }
  const wrapperClone = wrapper.cloneNode(true) as HTMLElement;
  wrapperClone.removeAttribute('id');
  wrapperClone.setAttribute(INJECTED_FLAG, 'true');

  const item = wrapperClone.matches('[role="menuitem"]')
    ? wrapperClone
    : wrapperClone.querySelector<HTMLElement>('[role="menuitem"]');
  if (!item) return null;

  item.removeAttribute('id');
  if (item instanceof HTMLAnchorElement) {
    item.removeAttribute('href');
    item.removeAttribute('target');
    item.removeAttribute('rel');
  }
  setLabel(item, NEW_ITEM_LABEL);
  return { wrapper: wrapperClone, item };
}

// --- Action ----------------------------------------------------------------

async function copyAsMarkdown(source: GithubLinkSource): Promise<void> {
  const settings = await loadSettings();
  const text = formatGithubLink(source, settings.githubLinkTemplate, {
    compactPathMaxLen: settings.githubCompactPathMaxLen,
  });
  try {
    await navigator.clipboard.writeText(text);
    if (settings.toastEnabled) showToast('success', 'Copied', text, settings.toastDurationMs);
  } catch (err) {
    console.warn('[give-me-a-link] clipboard write failed:', err);
    if (settings.toastEnabled) {
      const msg = String(err instanceof Error ? err.message : err);
      showToast('error', 'Copy failed', msg, settings.toastDurationMs);
    }
  }
}

function closeMenu(): void {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
}

// --- Injection -------------------------------------------------------------

function injectIntoMenu(menu: Element): void {
  if (handledMenus.has(menu)) return;
  const original = findMenuItem(menu, COPY_PERMALINK_LABEL);
  if (!original) return;

  const list = original.closest('ul, ol, [role="menu"]') ?? menu;
  const entry = cloneEntry(original, list);
  if (!entry) return;

  entry.item.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const source = buildSource(original);
    if (source) void copyAsMarkdown(source);
    closeMenu();
  });

  list.appendChild(entry.wrapper);
  handledMenus.add(menu);
}

function scanForMenus(root: ParentNode): void {
  for (const menu of root.querySelectorAll('[role="menu"]')) injectIntoMenu(menu);
  if (root instanceof Element && root.getAttribute('role') === 'menu') injectIntoMenu(root);
}

// --- Bootstrap -------------------------------------------------------------

new MutationObserver((records) => {
  if (!isBlobPage()) return;
  for (const rec of records) {
    for (const node of rec.addedNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) scanForMenus(node as Element);
    }
  }
}).observe(document.body, { childList: true, subtree: true });

scanForMenus(document.body);
