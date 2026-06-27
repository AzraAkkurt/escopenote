import { useCallback, useEffect, useState } from 'react';
import { ipcCall } from '@renderer/lib/ipc';
import { formatInvokeError } from '@shared/ipc-errors';
import type { Course } from '@shared/course-types';

interface UseCoursesResult {
  courses: Course[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (input: { name: string; icon?: string }) => Promise<Course>;
  update: (id: string, patch: { name?: string; icon?: string }) => Promise<Course>;
  remove: (id: string) => Promise<void>;
}

export function useCourses(): UseCoursesResult {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await ipcCall((api) => api.courses.list());
      setCourses(list);
    } catch (err) {
      setError(formatInvokeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(
    async (input: { name: string; icon?: string }) => {
      const course = await ipcCall((api) => api.courses.create(input));
      setCourses((prev) => [...prev, course]);
      return course;
    },
    [],
  );

  const update = useCallback(async (id: string, patch: { name?: string; icon?: string }) => {
    const course = await ipcCall((api) => api.courses.update(id, patch));
    setCourses((prev) => prev.map((c) => (c.id === id ? course : c)));
    return course;
  }, []);

  const remove = useCallback(async (id: string) => {
    await ipcCall((api) => api.courses.delete(id));
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { courses, loading, error, refresh, create, update, remove };
}
