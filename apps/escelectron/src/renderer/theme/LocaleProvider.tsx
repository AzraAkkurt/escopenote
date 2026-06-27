import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useAppSettings } from '@renderer/providers/SettingsProvider';
import type { LocaleCode } from '@shared/preferences';

interface LocaleContextValue {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { settings, setLocale } = useAppSettings();

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale: settings.locale,
      setLocale: (next) => {
        void setLocale(next);
      },
    }),
    [settings.locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return ctx;
}
