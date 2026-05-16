import { type Field, FIELDS } from './fields';
import type { ConditionalFormat } from '../shared/format';
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
      const previewLabel =
        preview && field.previewSourceLabel
          ? el('div', { className: 'hint' }, `Preview for ${field.previewSourceLabel}`)
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
    case 'rules': {
      wrapper.append(el('label', {}, field.label));
      if (hint) wrapper.append(hint);

      const testUrlId = `${id}-test-url`;
      const testUrlInput = el('input', {
        type: 'text',
        id: testUrlId,
        placeholder: 'https://github.com/foo/bar/issues/1',
      });
      const testBlock = el(
        'div',
        { className: 'rules__test' },
        el('label', { htmlFor: testUrlId }, 'Test URL'),
        testUrlInput,
      );
      wrapper.append(testBlock);

      const list = el('div', { className: 'rules-list' });
      wrapper.append(list);

      type Row = {
        node: HTMLElement;
        header: HTMLElement;
        patternInput: HTMLInputElement;
        templateInput: HTMLInputElement;
        errorEl: HTMLElement;
        previewEl: HTMLElement;
        upBtn: HTMLButtonElement;
        downBtn: HTMLButtonElement;
      };

      const rows: Row[] = [];
      const data: ConditionalFormat[] = [...initial[field.key]];
      const renderPreview = field.preview;
      const defaultSample = field.defaultSample;
      const fieldKey = field.key;

      function commit(): void {
        const valid = data.filter((r) => r.pattern.length > 0 && r.template.length > 0);
        save(patch(fieldKey, valid));
      }

      function refreshMatches(): void {
        const testUrl = testUrlInput.value;
        let matchedIndex = -1;
        if (testUrl.length > 0) {
          for (let i = 0; i < data.length; i++) {
            const p = data[i].pattern;
            if (p.length === 0) continue;
            try {
              if (new RegExp(p).test(testUrl)) {
                matchedIndex = i;
                break;
              }
            } catch {
              // skip
            }
          }
        }
        for (let i = 0; i < rows.length; i++) {
          const matched = i === matchedIndex;
          rows[i].node.classList.toggle('rule--matched', matched);
          const previewSource = matched && testUrl.length > 0 ? { url: testUrl } : defaultSample;
          try {
            rows[i].previewEl.textContent = renderPreview(data[i].template, previewSource);
          } catch {
            rows[i].previewEl.textContent = '';
          }
        }
      }

      function renumber(): void {
        for (let i = 0; i < rows.length; i++) {
          rows[i].header.textContent = `Rule ${i + 1}`;
          rows[i].upBtn.disabled = i === 0;
          rows[i].downBtn.disabled = i === rows.length - 1;
        }
      }

      function moveRow(from: number, to: number): void {
        if (to < 0 || to >= rows.length || from === to) return;
        const [row] = rows.splice(from, 1);
        rows.splice(to, 0, row);
        const [datum] = data.splice(from, 1);
        data.splice(to, 0, datum);
        for (const r of rows) list.appendChild(r.node);
        renumber();
        refreshMatches();
        commit();
      }

      function addRow(initialValue: ConditionalFormat): void {
        const index = rows.length;
        data.push({ ...initialValue });

        const header = el('span', { className: 'rule__title' }, `Rule ${index + 1}`);
        const upBtn = el('button', {
          type: 'button',
          className: 'rule__move',
          title: 'Move up',
          ariaLabel: 'Move rule up',
        });
        upBtn.textContent = '↑';
        const downBtn = el('button', {
          type: 'button',
          className: 'rule__move',
          title: 'Move down',
          ariaLabel: 'Move rule down',
        });
        downBtn.textContent = '↓';
        const removeBtn = el('button', { type: 'button', className: 'rule__remove' }, 'Remove');
        const patternInput = el('input', {
          type: 'text',
          placeholder: '^https://github\\.com/.+/issues/',
        });
        patternInput.value = initialValue.pattern;
        const templateInput = el('input', {
          type: 'text',
          placeholder: '[{host}/{path[0]}]({url})',
        });
        templateInput.value = initialValue.template;
        const errorEl = el('div', { className: 'rule__error' });
        errorEl.hidden = true;
        const previewEl = el('pre', { className: 'preview' });

        const node = el(
          'div',
          { className: 'rule' },
          el(
            'div',
            { className: 'rule__header' },
            header,
            el('div', { className: 'rule__actions' }, upBtn, downBtn, removeBtn),
          ),
          el('label', {}, 'Pattern'),
          patternInput,
          errorEl,
          el('label', {}, 'Template'),
          templateInput,
          previewEl,
        );

        const row: Row = {
          node,
          header,
          patternInput,
          templateInput,
          errorEl,
          previewEl,
          upBtn,
          downBtn,
        };
        rows.push(row);
        list.append(node);

        function updateRowError(): void {
          const pattern = patternInput.value;
          if (pattern.length === 0 || isValidRegex(pattern)) {
            errorEl.hidden = true;
            errorEl.textContent = '';
          } else {
            errorEl.hidden = false;
            errorEl.textContent = `Invalid regex: ${regexError(pattern)}`;
          }
        }

        patternInput.addEventListener('input', () => {
          const i = rows.indexOf(row);
          if (i === -1) return;
          data[i].pattern = patternInput.value;
          updateRowError();
          refreshMatches();
          commit();
        });

        templateInput.addEventListener('input', () => {
          const i = rows.indexOf(row);
          if (i === -1) return;
          data[i].template = templateInput.value;
          refreshMatches();
          commit();
        });

        removeBtn.addEventListener('click', () => {
          const i = rows.indexOf(row);
          if (i === -1) return;
          rows.splice(i, 1);
          data.splice(i, 1);
          node.remove();
          renumber();
          refreshMatches();
          commit();
        });

        upBtn.addEventListener('click', () => {
          const i = rows.indexOf(row);
          if (i === -1) return;
          moveRow(i, i - 1);
        });

        downBtn.addEventListener('click', () => {
          const i = rows.indexOf(row);
          if (i === -1) return;
          moveRow(i, i + 1);
        });

        updateRowError();
        renumber();
      }

      for (const rule of initial[field.key]) addRow(rule);

      const addBtn = el('button', { type: 'button', className: 'rules__add' }, '+ Add rule');
      addBtn.addEventListener('click', () => {
        addRow({ pattern: '', template: '' });
        refreshMatches();
        // No commit() — empty rows are filtered out and would no-op.
      });
      wrapper.append(addBtn);

      testUrlInput.addEventListener('input', refreshMatches);

      refreshMatches();

      return {
        node: wrapper,
        applyDependency: () => {},
      };
    }
  }
}

function isValidRegex(pattern: string): boolean {
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

function regexError(pattern: string): string {
  try {
    new RegExp(pattern);
    return '';
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
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
