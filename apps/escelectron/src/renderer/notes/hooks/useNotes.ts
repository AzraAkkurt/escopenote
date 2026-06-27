import { useCallback, useEffect, useState } from 'react';
import { ipcCall } from '@renderer/lib/ipc';
import { formatInvokeError } from '@shared/ipc-errors';
import type { Note } from '@shared/note-types';

interface UseNotesResult {
  notes: Note[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useNotes(filter?: { courseId?: string | null }): UseNotesResult {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await ipcCall((api) => api.notes.list(filter));
      setNotes(list);
    } catch (err) {
      setError(formatInvokeError(err));
    } finally {
      setLoading(false);
    }
  }, [filter?.courseId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { notes, loading, error, refresh };
}
