import { useCallback, useEffect, useMemo, useState } from 'react';
import { ipcCall } from '@renderer/lib/ipc';
import type { Course } from '@shared/course-types';
import type { Resource } from '@shared/resource-types';
import type { Note } from '@shared/note-types';
import type { LinkPickerItem } from '@renderer/notes/components/link-picker-types';

export function useLinkPickerData(courseId: string | null | undefined) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [allNotes, allResources, allCourses] = await Promise.all([
        ipcCall((api) => api.notes.list()),
        ipcCall((api) => api.resources.list()),
        ipcCall((api) => api.courses.list()),
      ]);
      setNotes(allNotes);
      setResources(allResources.filter((r) => r.kind !== 'note'));
      setCourses(allCourses);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const courseNameById = useMemo(
    () => new Map(courses.map((c) => [c.id, c.name])),
    [courses],
  );

  const noteItems: LinkPickerItem[] = useMemo(
    () =>
      notes.map((n) => ({
        kind: 'note' as const,
        id: n.id,
        label: n.title,
        subtitle: n.courseId ? courseNameById.get(n.courseId) : undefined,
        badge: 'note',
      })),
    [notes, courseNameById],
  );

  const resourceItems: LinkPickerItem[] = useMemo(
    () =>
      resources.map((r) => ({
        kind: 'resource' as const,
        id: r.id,
        label: r.name,
        subtitle: r.courseId ? courseNameById.get(r.courseId) : undefined,
        badge: r.kind,
      })),
    [resources, courseNameById],
  );

  const scopedNoteItems = useMemo(() => {
    if (!courseId) {
      return noteItems;
    }
    return noteItems.filter(
      (item) => notes.find((n) => n.id === item.id)?.courseId === courseId,
    );
  }, [courseId, noteItems, notes]);

  const scopedResourceItems = useMemo(() => {
    if (!courseId) {
      return resourceItems;
    }
    return resourceItems.filter(
      (item) => resources.find((r) => r.id === item.id)?.courseId === courseId,
    );
  }, [courseId, resourceItems, resources]);

  return {
    loading,
    reload,
    noteItems,
    resourceItems,
    scopedNoteItems,
    scopedResourceItems,
    courseNameById,
  };
}
