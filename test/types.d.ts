import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module 'bun:test' {
  interface Matchers<R, T = unknown> extends TestingLibraryMatchers<T, R> {}
  interface AsymmetricMatchers extends TestingLibraryMatchers<unknown, unknown> {}
}
