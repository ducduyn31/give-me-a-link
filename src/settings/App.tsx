import { FormProvider, useForm } from 'react-hook-form';
import { type Settings } from '../shared/settings';
import { STATUS_IDLE, STATUS_SAVED } from './constants';
import { useAutoSave } from './hooks/useAutoSave';
import ClipboardTemplate from './sections/ClipboardTemplate';
import GithubExtension from './sections/GithubExtension';
import ToastSettings from './sections/ToastSettings';

export default function App({ initialSettings }: { initialSettings: Settings }) {
  const form = useForm<Settings>({ defaultValues: initialSettings, mode: 'onChange' });
  const { saved } = useAutoSave(form);

  return (
    <FormProvider {...form}>
      <ClipboardTemplate />
      <ToastSettings />
      <GithubExtension />
      <div class="text-gray-500 text-xs mt-4 min-h-[1em]">{saved ? STATUS_SAVED : STATUS_IDLE}</div>
    </FormProvider>
  );
}
