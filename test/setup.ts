import '@testing-library/jest-dom';
import { afterEach } from 'bun:test';
import { cleanup } from '@testing-library/preact';

afterEach(cleanup);

const store = new Map<string, unknown>();

(globalThis as Record<string, unknown>).chrome = {
  storage: {
    local: {
      get(defaults: Record<string, unknown>): Promise<Record<string, unknown>> {
        const result: Record<string, unknown> = { ...defaults };
        for (const key of Object.keys(defaults)) {
          if (store.has(key)) result[key] = store.get(key);
        }
        return Promise.resolve(result);
      },
      set(items: Record<string, unknown>): Promise<void> {
        for (const [k, v] of Object.entries(items)) store.set(k, v);
        return Promise.resolve();
      },
    },
  },
};
