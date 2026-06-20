import { describe, expect, it, spyOn } from 'bun:test';
import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import App from '../../src/settings/App';
import { STATUS_SAVED } from '../../src/settings/constants';
import { DEFAULTS, type Settings } from '../../src/shared/settings';

describe('App', () => {
  describe('initial render', () => {
    it('shows the idle status message', () => {
      render(<App initialSettings={DEFAULTS} />);
      expect(screen.getByText('Settings save automatically.')).toBeTruthy();
    });

    it('disables the toast duration field when toast is initially off', () => {
      render(<App initialSettings={{ ...DEFAULTS, toastEnabled: false }} />);
      expect(screen.getByLabelText('Toast duration (ms)')).toBeDisabled();
    });
  });

  describe('when a field changes', () => {
    it('shows "Saved." in the status bar immediately after the change', async () => {
      render(<App initialSettings={DEFAULTS} />);
      fireEvent.click(screen.getByLabelText('Show confirmation toast on copy'));
      await waitFor(() => expect(screen.getByText(STATUS_SAVED)).toBeTruthy());
    });

    it('re-enables the toast duration field when toast is toggled on', () => {
      render(<App initialSettings={{ ...DEFAULTS, toastEnabled: false }} />);
      fireEvent.click(screen.getByLabelText('Show confirmation toast on copy'));
      expect(screen.getByLabelText('Toast duration (ms)')).not.toBeDisabled();
    });

    it('persists the updated value to chrome.storage', () => {
      const setSpy = spyOn(chrome.storage.local, 'set');
      render(<App initialSettings={DEFAULTS} />);
      fireEvent.click(screen.getByLabelText('Show confirmation toast on copy'));

      expect(setSpy).toHaveBeenCalled();
      const saved = setSpy.mock.calls[0][0] as Partial<Settings>;
      expect(saved.toastEnabled).toBe(false);
    });
  });
});
