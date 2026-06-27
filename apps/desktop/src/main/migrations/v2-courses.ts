import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { LibraryIndexStore } from '../../../shared/library-types';
import type { Course } from '../../../shared/course-types';
import type { FileResource, ResourcesStore } from '../../../shared/resource-types';
import type { RagIndexData } from '../../../shared/rag-types';
import { normalizeLibraryStore } from '../../../shared/library-store-utils';
import { normalizeCoursesStore } from '../../../shared/course-store-utils';
import { readNamespace, writeNamespace } from '../storage/file-store';
import { writeFileAtomic } from '../storage/atomic-write';

function flagPath(): string {
  return path.join(app.getPath('userData'), 'migration-v2.completed');
}

async function readMigrationFlag(): Promise<boolean> {
  try {
    await fs.access(flagPath());
    return true;
  } catch {
    return false;
  }
}

async function setMigrationFlag(): Promise<void> {
  await fs.writeFile(flagPath(), new Date().toISOString(), 'utf8');
}

async function readRagIndex(): Promise<RagIndexData> {
  const indexPath = path.join(app.getPath('userData'), 'rag-index.json');
  try {
    const raw = await fs.readFile(indexPath, 'utf8');
    return JSON.parse(raw) as RagIndexData;
  } catch {
    return { version: 1, chunks: [] };
  }
}

async function writeRagIndex(data: RagIndexData): Promise<void> {
  const indexPath = path.join(app.getPath('userData'), 'rag-index.json');
  await writeFileAtomic(indexPath, JSON.stringify(data, null, 2));
}

export async function runV2CoursesMigration(): Promise<void> {
  if (await readMigrationFlag()) {
    return;
  }

  const existingCourses = normalizeCoursesStore(await readNamespace('courses.index'));
  if (existingCourses.courses.length > 0) {
    await setMigrationFlag();
    return;
  }

  const legacyLibrary = normalizeLibraryStore(
    await readNamespace<unknown>('library.index' as never),
  ) as LibraryIndexStore;

  const resources: FileResource[] = legacyLibrary.files.map((f) => ({
    id: f.id.startsWith('lib_') ? f.id.replace(/^lib_/, 'res_') : f.id,
    courseId: null,
    kind: 'file' as const,
    name: f.name,
    path: f.path,
    type: f.type,
    sizeBytes: f.sizeBytes,
    status: f.status,
    addedAt: f.addedAt,
    chunkCount: f.chunkCount,
    lastIndexedAt: f.lastIndexedAt,
    errorMessage: f.errorMessage,
    indexProgress: f.indexProgress,
    previewText: f.previewText,
  }));

  const generalCourse: Course = {
    id: `course_${Date.now()}`,
    name: 'Genel',
    icon: '📚',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resourceIds: resources.map((r) => r.id),
  };

  for (const r of resources) {
    r.courseId = generalCourse.id;
  }

  const coursesStore = { courses: [generalCourse] };
  const resourcesStore: ResourcesStore = { resources };

  await writeNamespace('courses.index', coursesStore);
  await writeNamespace('resources.index', resourcesStore);

  const rag = await readRagIndex();
  const updatedChunks = rag.chunks.map((c) => ({
    ...c,
    resourceId: c.resourceId ?? c.fileId,
    fileId: c.fileId ?? c.resourceId,
    courseId: c.courseId ?? generalCourse.id,
    resourceKind: c.resourceKind ?? ('file' as const),
  }));
  await writeRagIndex({ version: 1, chunks: updatedChunks });

  await setMigrationFlag();
}
