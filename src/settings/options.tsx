import { render } from 'preact';
import { loadSettings } from '../shared/settings';
import App from './App';

async function init(): Promise<void> {
  const settings = await loadSettings();
  const root = document.getElementById('root');
  if (!root) throw new Error('options: missing #root');
  render(<App initialSettings={settings} />, root);
}

void init().catch((err) => {
  console.error('options page failed to initialize:', err);
  const root = document.getElementById('root');
  if (root) root.textContent = 'Failed to load settings. Please try reopening this page.';
});
