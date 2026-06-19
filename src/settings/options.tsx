import { render } from 'preact';
import { loadSettings } from '../shared/settings';
import App from './App';

async function init(): Promise<void> {
  const settings = await loadSettings();
  const root = document.getElementById('root');
  if (!root) throw new Error('options: missing #root');
  render(<App initialSettings={settings} />, root);
}

void init();
