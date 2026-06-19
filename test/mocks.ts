import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { mock } from 'bun:test';

// Register the DOM environment before any other preload file imports
// @testing-library/dom — screen.js inspects `document` at module init time.
GlobalRegistrator.register();

// react-hook-form and usehooks-ts import from 'react'. Redirect them to
// preact/compat so they share the same Preact ESM instance as our components.
// Using dynamic import() forces the ESM build — require() loads a separate
// CJS instance whose options singleton differs from preact/test-utils'.
mock.module('react', async () => {
  const compat = await import('preact/compat');
  return { ...compat, default: compat };
});
mock.module('react-dom', async () => {
  const compat = await import('preact/compat');
  return { ...compat, default: compat };
});
mock.module('react/jsx-runtime', async () => {
  const jsx = await import('preact/jsx-runtime');
  return { ...jsx, default: jsx };
});
