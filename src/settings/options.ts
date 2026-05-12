import { type Field, FIELDS, PREVIEW_SAMPLE } from './fields';
import { loadSettings, saveSettings, type Settings } from '../shared/settings';

const STATUS_IDLE = 'Settings save automatically.';
const STATUS_SAVED = 'Saved.';
const STATUS_FLASH_MS = 1200;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Partial<HTMLElementTagNameMap[K]> = {},
  ...children: Array<Node | string>
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  Object.assign(node, attrs);
  for (const child of children) {
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

function patch<K extends keyof Settings>(key: K, value: Settings[K]): Partial<Settings> {
  return { [key]: value } as Partial<Settings>;
}

type FieldHandle = {
  node: HTMLElement;
  applyDependency: (s: Settings) => void;
};

function renderField(
  field: Field,
  initial: Settings,
  save: (p: Partial<Settings>) => void,
): FieldHandle {
  const id = `f-${field.key}`;
  const wrapper = el('div', { className: 'field' });
  const hint = field.hint ? el('div', { className: 'hint' }, field.hint) : null;

  switch (field.kind) {
    case 'select': {
      const select = el('select', { id });
      for (const opt of field.options) {
        select.append(el('option', { value: opt.value }, opt.label));
      }
      select.value = initial[field.key];
      select.addEventListener('change', () => {
        const next = field.parse(select.value);
        select.value = next;
        save(patch(field.key, next));
      });
      wrapper.append(el('label', { htmlFor: id }, field.label), select);
      if (hint) wrapper.append(hint);
      return {
        node: wrapper,
        applyDependency: (s) => {
          select.disabled = field.disabledWhen?.(s) ?? false;
        },
      };
    }
    case 'text': {
      const input = el('input', { type: 'text', id });
      if (field.placeholder) input.placeholder = field.placeholder;
      input.value = initial[field.key];
      const preview = field.preview;
      const previewEl = preview
        ? el('pre', { className: 'preview' }, preview(initial[field.key]))
        : null;
      const previewLabel = preview
        ? el('div', { className: 'hint' }, `Preview for ${PREVIEW_SAMPLE.url}`)
        : null;
      input.addEventListener('input', () => {
        const next = field.parse(input.value);
        if (previewEl && preview) previewEl.textContent = preview(next);
        save(patch(field.key, next));
      });
      wrapper.append(el('label', { htmlFor: id }, field.label), input);
      if (hint) wrapper.append(hint);
      if (previewLabel) wrapper.append(previewLabel);
      if (previewEl) wrapper.append(previewEl);
      return {
        node: wrapper,
        applyDependency: (s) => {
          input.disabled = field.disabledWhen?.(s) ?? false;
        },
      };
    }
    case 'checkbox': {
      const input = el('input', { type: 'checkbox', id });
      input.checked = initial[field.key];
      input.addEventListener('change', () => {
        save(patch(field.key, input.checked));
      });
      wrapper.append(
        el('div', { className: 'row' }, input, el('label', { htmlFor: id }, field.label)),
      );
      if (hint) wrapper.append(hint);
      return {
        node: wrapper,
        applyDependency: (s) => {
          input.disabled = field.disabledWhen?.(s) ?? false;
        },
      };
    }
    case 'number': {
      const input = el('input', {
        type: 'number',
        id,
        min: String(field.min),
        max: String(field.max),
        step: String(field.step),
      });
      input.value = String(initial[field.key]);
      input.addEventListener('change', () => {
        const next = field.parse(input.value);
        input.value = String(next);
        save(patch(field.key, next));
      });
      wrapper.append(el('label', { htmlFor: id }, field.label), input);
      if (hint) wrapper.append(hint);
      return {
        node: wrapper,
        applyDependency: (s) => {
          input.disabled = field.disabledWhen?.(s) ?? false;
        },
      };
    }
  }
}

function byId<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`options: missing element #${id}`);
  return node as T;
}

async function init(): Promise<void> {
  const root = byId<HTMLElement>('root');
  const statusEl = byId<HTMLDivElement>('status');
  const settings = await loadSettings();
  const handles: FieldHandle[] = [];

  let statusTimer: ReturnType<typeof setTimeout> | undefined;
  function flashStatus(message: string): void {
    statusEl.textContent = message;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
      statusEl.textContent = STATUS_IDLE;
    }, STATUS_FLASH_MS);
  }

  async function save(p: Partial<Settings>): Promise<void> {
    Object.assign(settings, p);
    await saveSettings(p);
    for (const h of handles) h.applyDependency(settings);
    flashStatus(STATUS_SAVED);
  }

  for (const field of FIELDS) {
    const handle = renderField(field, settings, (p) => void save(p));
    handle.applyDependency(settings);
    handles.push(handle);
    root.append(handle.node);
  }
}

void init();
