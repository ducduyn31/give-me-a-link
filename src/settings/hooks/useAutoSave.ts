import { useEffect, useRef } from 'preact/hooks';
import type { UseFormReturn } from 'react-hook-form';
import { useBoolean, useTimeout } from 'usehooks-ts';
import { saveSettings, type Settings } from '../../shared/settings';
import { STATUS_FLASH_MS } from '../constants';

export interface UseAutoSaveResult {
  saved: boolean;
}

function persistSettingsAndNotify(values: Partial<Settings>, onSaved: () => void): void {
  void saveSettings({
    ...values,
    conditionalFormats: (values.conditionalFormats ?? []).filter((r) => r?.pattern && r?.template),
  } as Settings).then(onSaved);
}

export function useAutoSave(form: UseFormReturn<Settings>): UseAutoSaveResult {
  const { value: saved, setTrue: showSaved, setFalse: hideSaved } = useBoolean(false);
  useTimeout(hideSaved, saved ? STATUS_FLASH_MS : null);

  // useFieldArray fires one internal update on mount before the user touches
  // anything. Skip that first callback so we don't save or flash on load.
  const skipFirst = useRef(true);

  useEffect(() => {
    const { unsubscribe } = form.watch((values) => {
      if (skipFirst.current) {
        skipFirst.current = false;
        return;
      }
      persistSettingsAndNotify(values as Partial<Settings>, showSaved);
    });
    return unsubscribe;
  }, [form.watch, showSaved]);

  return { saved };
}
