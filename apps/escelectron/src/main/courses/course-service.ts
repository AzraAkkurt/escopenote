import { randomUUID } from 'node:crypto';
import type { Course, CourseWithResources, CoursesStore } from '../../../shared/course-types';
import { IpcError } from '../../../shared/ipc-errors';
import { normalizeCoursesStore } from '../../../shared/course-store-utils';
import { readNamespace, writeNamespace } from '../storage/file-store';
import { listResourcesByCourse, removeResource } from '../resources/resource-service';

const NAMESPACE = 'courses.index' as const;

async function readStore(): Promise<CoursesStore> {
  const data = await readNamespace<unknown>(NAMESPACE);
  return normalizeCoursesStore(data);
}

async function writeStore(store: CoursesStore): Promise<void> {
  await writeNamespace(NAMESPACE, store);
}

export async function listCourses(): Promise<Course[]> {
  const store = await readStore();
  return store.courses;
}

export async function getCourse(id: string): Promise<CourseWithResources> {
  const store = await readStore();
  const course = store.courses.find((c) => c.id === id);
  if (!course) {
    throw new IpcError('NOT_FOUND', 'Course not found');
  }
  const resources = await listResourcesByCourse(id);
  return { ...course, resources };
}

export async function createCourse(input: { name: string; icon?: string }): Promise<Course> {
  const name = input.name.trim();
  if (!name) {
    throw new IpcError('VALIDATION_ERROR', 'Course name is required');
  }
  const store = await readStore();
  const now = new Date().toISOString();
  const course: Course = {
    id: `course_${randomUUID().slice(0, 12)}`,
    name,
    icon: input.icon,
    createdAt: now,
    updatedAt: now,
    resourceIds: [],
  };
  store.courses.push(course);
  await writeStore(store);
  return course;
}

export async function updateCourse(
  id: string,
  patch: { name?: string; icon?: string },
): Promise<Course> {
  const store = await readStore();
  const index = store.courses.findIndex((c) => c.id === id);
  if (index < 0) {
    throw new IpcError('NOT_FOUND', 'Course not found');
  }
  const current = store.courses[index];
  const next: Course = {
    ...current,
    name: patch.name?.trim() ? patch.name.trim() : current.name,
    icon: patch.icon !== undefined ? patch.icon : current.icon,
    updatedAt: new Date().toISOString(),
  };
  store.courses[index] = next;
  await writeStore(store);
  return next;
}

export async function deleteCourse(id: string): Promise<void> {
  const store = await readStore();
  const course = store.courses.find((c) => c.id === id);
  if (!course) {
    throw new IpcError('NOT_FOUND', 'Course not found');
  }
  for (const resourceId of [...course.resourceIds]) {
    await removeResource(resourceId);
  }
  store.courses = store.courses.filter((c) => c.id !== id);
  await writeStore(store);
}

export async function attachResourceToCourse(courseId: string, resourceId: string): Promise<void> {
  const store = await readStore();
  const index = store.courses.findIndex((c) => c.id === courseId);
  if (index < 0) {
    throw new IpcError('NOT_FOUND', 'Course not found');
  }
  const course = store.courses[index];
  if (!course.resourceIds.includes(resourceId)) {
    course.resourceIds.push(resourceId);
    course.updatedAt = new Date().toISOString();
    store.courses[index] = course;
    await writeStore(store);
  }
}

export async function detachResourceFromCourse(courseId: string, resourceId: string): Promise<void> {
  const store = await readStore();
  const index = store.courses.findIndex((c) => c.id === courseId);
  if (index < 0) {
    return;
  }
  const course = store.courses[index];
  course.resourceIds = course.resourceIds.filter((rid) => rid !== resourceId);
  course.updatedAt = new Date().toISOString();
  store.courses[index] = course;
  await writeStore(store);
}
