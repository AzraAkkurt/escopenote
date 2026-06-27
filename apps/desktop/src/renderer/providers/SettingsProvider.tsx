import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Spinner } from '@renderer/components/ui';
import { useSettings } from '@renderer/hooks/useSettings';
import { resolveTheme, type ResolvedTheme, type ThemePreference } from '@shared/preferences';
import type { AppSettings } from '@shared/settings';
import type { LocaleCode } from '@shared/preferences';

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => Promise<AppSettings>;
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setThemePreference: (theme: ThemePreference) => Promise<void>;
  setLocale: (locale: LocaleCode) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function applyDocumentTheme(resolved: ResolvedTheme): void {
  document.documentElement.setAttribute('data-theme', resolved);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { settings, loading, error, updateSettings } = useSettings();
  const { i18n } = useTranslation();

  const resolvedTheme = resolveTheme(settings.theme);

  useEffect(() => {
    applyDocumentTheme(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    if (i18n.language !== settings.locale) {
      void i18n.changeLanguage(settings.locale);
    }
  }, [settings.locale, i18n]);

  useEffect(() => {
    if (settings.theme !== 'system') {
      return;
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyDocumentTheme(resolveTheme('system'));
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [settings.theme]);

  const setThemePreference = useCallback(
    async (theme: ThemePreference) => {
      await updateSettings({ theme, preferencesInitialized: true });
    },
    [updateSettings],
  );

  const setLocale = useCallback(
    async (locale: LocaleCode) => {
      await updateSettings({ locale, preferencesInitialized: true });
    },
    [updateSettings],
  );

  if (loading) {
    return (
      <div className="app-bootstrap">
        <Spinner size="lg" label="Loading" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-bootstrap app-bootstrap--error">
        <p>{error}</p>
      </div>
    );
  }

  const value: SettingsContextValue = {
    settings,
    updateSettings,
    themePreference: settings.theme,
    resolvedTheme,
    setThemePreference,
    setLocale,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useAppSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useAppSettings must be used within SettingsProvider');
  }
  return ctx;
}
