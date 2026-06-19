const STORAGE_KEY = '__gmal_settings__';

function read(): Record<string, unknown> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, unknown>;
  } catch {
    return {};
  }
}

function write(data: Record<string, unknown>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

(window as unknown as Record<string, unknown>).chrome = {
  storage: {
    local: {
      get(defaults: Record<string, unknown>): Promise<Record<string, unknown>> {
        return Promise.resolve({ ...defaults, ...read() });
      },
      set(items: Record<string, unknown>): Promise<void> {
        write({ ...read(), ...items });
        return Promise.resolve();
      },
    },
  },
};
