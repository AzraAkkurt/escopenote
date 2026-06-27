import type { LocaleCode, ThemePreference } from '@shared/preferences';
import type { AppSettings } from '@shared/settings';

const KEYS = {
  theme: 'escopenote-theme',
  locale: 'escopenote-locale',
  initialized: 'escopenote-prefs-initialized',
} as const;

/** One-time migration from Phase 2 localStorage to Phase 3 IPC settings. */
export function readLegacyLocalSettings(): Partial<AppSettings> | null {
  const theme = localStorage.getItem(KEYS.theme);
  const locale = localStorage.getItem(KEYS.locale);
  const initialized = localStorage.getItem(KEYS.initialized);

  if (!theme && !locale && !initialized) {
    return null;
  }

  const patch: Partial<AppSettings> = {};

  if (theme === 'light' || theme === 'dark' || theme === 'system') {
    patch.theme = theme as ThemePreference;
  }
  if (locale === 'en' || locale === 'tr') {
    patch.locale = locale as LocaleCode;
  }
  if (initialized === '1') {
    patch.preferencesInitialized = true;
  }

  return patch;
}

export function clearLegacyLocalSettings(): void {
  localStorage.removeItem(KEYS.theme);
  localStorage.removeItem(KEYS.locale);
  localStorage.removeItem(KEYS.initialized);
}
