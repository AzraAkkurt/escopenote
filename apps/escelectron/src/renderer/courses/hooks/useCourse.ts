import { useCallback, useEffect, useState } from 'react';
import { ipcCall } from '@renderer/lib/ipc';
import { formatInvokeError } from '@shared/ipc-errors';
import type { CourseWithResources } from '@shared/course-types';

interface UseCourseResult {
  course: CourseWithResources | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCourse(courseId: string | undefined): UseCourseResult {
  const [course, setCourse] = useState<CourseWithResources | null>(null);
  const [loading, setLoading] = useState(Boolean(courseId));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!courseId) {
      setCourse(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await ipcCall((api) => api.courses.get(courseId));
      setCourse(data);
    } catch (err) {
      setError(formatInvokeError(err));
      setCourse(null);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { course, loading, error, refresh };
}
