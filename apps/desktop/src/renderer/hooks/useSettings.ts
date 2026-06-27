import { useCallback, useEffect, useState } from 'react';
import { useFixturesMode } from '@renderer/config/env';
import { ipcCall } from '@renderer/lib/ipc';
import { clearLegacyLocalSettings, readLegacyLocalSettings } from '@renderer/theme/legacy-storage';
import { DEFAULT_SETTINGS, type AppSettings } from '@shared/settings';

interface UseSettingsResult {
  settings: AppSettings;
  loading: boolean;
  error: string | null;
  updateSettings: (patch: Partial<AppSettings>) => Promise<AppSettings>;
  reload: () => Promise<void>;
}

export function useSettings(): UseSettingsResult {
  const fixtures = useFixturesMode();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let current = await ipcCall((api) => api.settings.get());

      const legacy = readLegacyLocalSettings();
      if (legacy && !current.preferencesInitialized) {
        current = await ipcCall((api) => api.settings.set({ ...legacy, preferencesInitialized: true }));
        clearLegacyLocalSettings();
      }

      setSettings(current);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      if (fixtures) {
        setSettings(DEFAULT_SETTINGS);
      }
    } finally {
      setLoading(false);
    }
  }, [fixtures]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    const next = await ipcCall((api) => api.settings.set(patch));
    setSettings(next);
    return next;
  }, []);

  return { settings, loading, error, updateSettings, reload };
}
