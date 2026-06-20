import { render } from '@testing-library/preact';
import type { ComponentChildren } from 'preact';
import { FormProvider, useForm } from 'react-hook-form';
import { DEFAULTS, type Settings } from '../../src/shared/settings';

function TestFormProvider({
  children,
  defaults,
}: {
  children: ComponentChildren;
  defaults: Partial<Settings>;
}) {
  const form = useForm<Settings>({
    defaultValues: { ...DEFAULTS, ...defaults },
    mode: 'onChange',
  });
  return <FormProvider {...form}>{children}</FormProvider>;
}

export function renderWithForm(ui: ComponentChildren, defaults: Partial<Settings> = {}) {
  return render(<TestFormProvider defaults={defaults}>{ui}</TestFormProvider>);
}
