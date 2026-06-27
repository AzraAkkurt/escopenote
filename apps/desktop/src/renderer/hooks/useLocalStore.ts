import { useCallback, useEffect, useState } from 'react';
import { useFixturesMode } from '@renderer/config/env';
import { getFixture } from '@renderer/fixtures';
import { ipcCall } from '@renderer/lib/ipc';
import type { StorageNamespace } from '@shared/storage-namespaces';

interface UseLocalStoreResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  save: (value: T) => Promise<void>;
  reload: () => Promise<void>;
}

export function useLocalStore<T>(namespace: StorageNamespace): UseLocalStoreResult<T> {
  const fixtures = useFixturesMode();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (fixtures) {
        setData(getFixture<T>(namespace));
        return;
      }
      const value = await ipcCall((api) => api.storage.read<T>(namespace));
      setData(value);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Storage read failed');
      if (fixtures) {
        setData(getFixture<T>(namespace));
      }
    } finally {
      setLoading(false);
    }
  }, [namespace, fixtures]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const save = useCallback(
    async (value: T) => {
      if (fixtures) {
        setData(value);
        return;
      }
      await ipcCall((api) => api.storage.write(namespace, value));
      setData(value);
    },
    [namespace, fixtures],
  );

  return { data, loading, error, save, reload };
}
