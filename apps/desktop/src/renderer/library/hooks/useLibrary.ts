import { useCallback, useEffect, useRef, useState } from 'react';
import { useFixturesMode } from '@renderer/config/env';
import { createLibraryFileId, mergeProgress, normalizeLibraryStore } from '@renderer/library/defaults';
import { runClientMockIndexing } from '@renderer/library/mock-index-client';
import { useLocalStore } from '@renderer/hooks/useLocalStore';
import { ipcCall } from '@renderer/lib/ipc';
import { formatInvokeError } from '@shared/ipc-errors';
import type { LibraryFileEntry, LibraryIndexStore } from '@shared/library-types';

interface UseLibraryResult {
  files: LibraryFileEntry[];
  loading: boolean;
  error: string | null;
  addFromPaths: (paths: string[]) => Promise<number>;
  remove: (id: string) => Promise<void>;
  reindex: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

export function useLibrary(): UseLibraryResult {
  const fixtures = useFixturesMode();
  const localStore = useLocalStore<LibraryIndexStore>('library.index');
  const [files, setFiles] = useState<LibraryFileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelRefs = useRef<Map<string, () => void>>(new Map());

  const persistFixture = useCallback(
    async (next: LibraryFileEntry[]) => {
      await localStore.save({ files: next });
      setFiles(next);
    },
    [localStore],
  );

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (fixtures) {
        const store = normalizeLibraryStore(localStore.data);
        setFiles(store.files);
        return;
      }
      const list = await ipcCall((api) => api.library.list());
      setFiles(list);
    } catch (err) {
      setError(formatInvokeError(err));
    } finally {
      setLoading(false);
    }
  }, [fixtures, localStore.data]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (fixtures) {
      return;
    }
    const unsubscribe = window.escopenote.library.onProgress((event) => {
      setFiles((prev) => mergeProgress(prev, event));
    });
    return unsubscribe;
  }, [fixtures]);

  const startFixtureIndex = useCallback(
    (entry: LibraryFileEntry) => {
      cancelRefs.current.get(entry.id)?.();
      const cancel = runClientMockIndexing(entry, (event) => {
        setFiles((prev) => {
          const next = mergeProgress(prev, event);
          void localStore.save({ files: next });
          return next;
        });
      });
      cancelRefs.current.set(entry.id, cancel);
    },
    [localStore],
  );

  const addFromPaths = useCallback(
    async (paths: string[]): Promise<number> => {
      if (paths.length === 0) {
        return 0;
      }

      if (fixtures) {
        const existing = new Set(files.map((f) => f.path));
        const added: LibraryFileEntry[] = paths
          .filter((p) => !existing.has(p))
          .map((filePath) => {
            const name = filePath.split(/[/\\]/).pop() ?? filePath;
            const ext = name.includes('.') ? name.split('.').pop()?.toLowerCase() : '';
            const type =
              ext === 'pdf' ||
              ext === 'html' ||
              ext === 'htm' ||
              ext === 'txt' ||
              ext === 'md' ||
              ext === 'csv' ||
              ext === 'json' ||
              ext === 'docx'
                ? (ext === 'htm' ? 'html' : ext) as LibraryFileEntry['type']
                : 'unknown';
            return {
              id: createLibraryFileId(),
              name,
              path: filePath,
              type,
              sizeBytes: 0,
              status: 'pending' as const,
              addedAt: new Date().toISOString(),
              indexProgress: 0,
            };
          });

        if (added.length === 0) {
          return 0;
        }

        const next = [...files, ...added];
        await persistFixture(next);
        for (const entry of added) {
          startFixtureIndex(entry);
        }
        return added.length;
      }

      const added = await ipcCall((api) => api.library.addFiles(paths));
      setFiles((prev) => {
        const byId = new Map(prev.map((f) => [f.id, f]));
        for (const entry of added) {
          byId.set(entry.id, entry);
        }
        return Array.from(byId.values());
      });
      return added.length;
    },
    [files, fixtures, persistFixture, startFixtureIndex],
  );

  const remove = useCallback(
    async (id: string) => {
      cancelRefs.current.get(id)?.();
      cancelRefs.current.delete(id);

      if (fixtures) {
        await persistFixture(files.filter((f) => f.id !== id));
        return;
      }

      await ipcCall((api) => api.library.remove(id));
      setFiles((prev) => prev.filter((f) => f.id !== id));
    },
    [files, fixtures, persistFixture],
  );

  const reindex = useCallback(
    async (id: string) => {
      if (fixtures) {
        const entry = files.find((f) => f.id === id);
        if (!entry) {
          return;
        }
        const reset: LibraryFileEntry = {
          ...entry,
          status: 'pending',
          indexProgress: 0,
          errorMessage: undefined,
          chunkCount: undefined,
          lastIndexedAt: undefined,
          previewText: undefined,
        };
        const next = files.map((f) => (f.id === id ? reset : f));
        await persistFixture(next);
        startFixtureIndex(reset);
        return;
      }

      const updated = await ipcCall((api) => api.library.reindex(id));
      setFiles((prev) => prev.map((f) => (f.id === id ? updated : f)));
    },
    [files, fixtures, persistFixture, startFixtureIndex],
  );

  return { files, loading, error, addFromPaths, remove, reindex, reload };
}
