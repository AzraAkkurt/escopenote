import type { Course, CoursesStore } from './course-types';

export const EMPTY_COURSES: CoursesStore = { courses: [] };

export function normalizeCoursesStore(data: unknown): CoursesStore {
  if (!data || typeof data !== 'object') {
    return EMPTY_COURSES;
  }
  const raw = data as Partial<CoursesStore>;
  if (!Array.isArray(raw.courses)) {
    return EMPTY_COURSES;
  }
  return {
    courses: raw.courses.filter(
      (c): c is Course =>
        !!c &&
        typeof c === 'object' &&
        typeof c.id === 'string' &&
        typeof c.name === 'string' &&
        Array.isArray(c.resourceIds),
    ),
  };
}
