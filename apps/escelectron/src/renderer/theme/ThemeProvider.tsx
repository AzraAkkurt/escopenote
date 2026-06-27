import { createContext, useContext, type ReactNode } from 'react';
import { useAppSettings } from '@renderer/providers/SettingsProvider';
import type { ResolvedTheme, ThemePreference } from '@shared/preferences';

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (theme: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { themePreference, resolvedTheme, setThemePreference } = useAppSettings();

  const value: ThemeContextValue = {
    preference: themePreference,
    resolved: resolvedTheme,
    setPreference: (theme) => {
      void setThemePreference(theme);
    },
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
