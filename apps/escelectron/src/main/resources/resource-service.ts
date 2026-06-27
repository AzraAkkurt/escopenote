import type { BrowserWindow } from 'electron';
import { randomUUID } from 'node:crypto';
import { IPC_CHANNELS } from '../../../shared/ipc-types';
import type { FileResource, LinkResource, Resource, ResourceProgressEvent, ResourcesStore } from '../../../shared/resource-types';
import { IpcError } from '../../../shared/ipc-errors';
import { normalizeResourcesStore } from '../../../shared/resource-store-utils';
import { indexResource } from '../rag/indexer';
import { removeChunksForResource } from '../rag/vector-store';
import { readNamespace, writeNamespace } from '../storage/file-store';
import { buildEntryFromPath } from '../library/file-meta';
import { fetchUrlAsMarkdown } from './link-fetcher';
import { attachResourceToCourse, detachResourceFromCourse } from '../courses/course-service';

const NAMESPACE = 'resources.index' as const;

let getMainWindow: (() => BrowserWindow) | null = null;
const activeJobs = new Map<string, { cancelled: boolean }>();

export function initResourceService(getWindow: () => BrowserWindow): void {
  getMainWindow = getWindow;
}

function emitProgress(event: ResourceProgressEvent): void {
  const win = getMainWindow?.();
  if (!win || win.isDestroyed()) {
    return;
  }
  win.webContents.send(IPC_CHANNELS.RESOURCES_PROGRESS, event);
  win.webContents.send(IPC_CHANNELS.LIBRARY_PROGRESS, event);
}

async function readStore(): Promise<ResourcesStore> {
  const data = await readNamespace<unknown>(NAMESPACE);
  const store = normalizeResourcesStore(data);
  if (data !== null && JSON.stringify(data) !== JSON.stringify(store)) {
    await writeStore(store);
  }
  return store;
}

async function writeStore(store: ResourcesStore): Promise<void> {
  await writeNamespace(NAMESPACE, store);
}

async function updateResource(id: string, patch: Partial<Resource>): Promise<Resource> {
  const store = await readStore();
  const index = store.resources.findIndex((r) => r.id === id);
  if (index < 0) {
    throw new IpcError('NOT_FOUND', 'Resource not found');
  }
  const next = { ...store.resources[index], ...patch } as Resource;
  store.resources[index] = next;
  await writeStore(store);
  return next;
}

function cancelJob(id: string): void {
  const job = activeJobs.get(id);
  if (job) {
    job.cancelled = true;
    activeJobs.delete(id);
  }
}

async function applyProgress(event: ResourceProgressEvent): Promise<void> {
  emitProgress(event);
  const patch: Partial<Resource> = {
    status: event.status,
    indexProgress: event.progress,
    errorMessage: event.errorMessage,
    chunkCount: event.chunkCount,
    lastIndexedAt: event.lastIndexedAt,
    previewText: event.previewText,
  };
  if (event.status === 'ready') {
    patch.errorMessage = undefined;
  }
  if (event.status === 'failed') {
    patch.chunkCount = undefined;
    patch.lastIndexedAt = undefined;
    patch.previewText = undefined;
  }
  await updateResource(event.id, patch);
}

async function startIndexing(resource: Resource): Promise<void> {
  cancelJob(resource.id);
  const job = { cancelled: false };
  activeJobs.set(resource.id, job);

  await updateResource(resource.id, {
    status: 'indexing',
    indexProgress: 0,
    errorMessage: undefined,
  });

  await indexResource(
    resource,
    (event) => {
      void applyProgress(event);
    },
    () => job.cancelled,
  );

  activeJobs.delete(resource.id);
}

export async function listAllResources(): Promise<Resource[]> {
  const store = await readStore();
  return store.resources;
}

export async function listResourcesByCourse(courseId: string): Promise<Resource[]> {
  const store = await readStore();
  return store.resources.filter((r) => r.courseId === courseId);
}

export async function getResource(id: string): Promise<Resource> {
  const store = await readStore();
  const resource = store.resources.find((r) => r.id === id);
  if (!resource) {
    throw new IpcError('NOT_FOUND', 'Resource not found');
  }
  return resource;
}

export async function addFilesToCourse(courseId: string, paths: string[]): Promise<Resource[]> {
  const store = await readStore();
  const existingPaths = new Set(
    store.resources.filter((r) => r.kind === 'file').map((r) => (r as FileResource).path),
  );
  const added: Resource[] = [];
  const errors: string[] = [];

  for (const filePath of paths) {
    if (existingPaths.has(filePath)) {
      continue;
    }
    try {
      const entry = await buildEntryFromPath(filePath);
      const resource: FileResource = {
        id: entry.id.replace(/^lib_/, 'res_'),
        courseId,
        kind: 'file',
        name: entry.name,
        path: entry.path,
        type: entry.type,
        sizeBytes: entry.sizeBytes,
        status: 'pending',
        addedAt: entry.addedAt,
        indexProgress: 0,
      };
      if (resource.id.startsWith('lib_')) {
        resource.id = `res_${randomUUID().slice(0, 12)}`;
      }
      store.resources.push(resource);
      existingPaths.add(filePath);
      added.push(resource);
      await attachResourceToCourse(courseId, resource.id);
    } catch (error) {
      const message =
        error instanceof IpcError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not add file';
      errors.push(message);
    }
  }

  if (added.length === 0) {
    if (errors.length > 0) {
      throw new IpcError('VALIDATION_ERROR', errors[0]!);
    }
    return [];
  }

  await writeStore(store);

  for (const resource of added) {
    void startIndexing(resource);
  }

  if (errors.length > 0) {
    console.warn('[escopenote] Some files were skipped:', errors);
  }

  return added;
}

export async function addLinkToCourse(courseId: string, url: string): Promise<LinkResource> {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new IpcError('VALIDATION_ERROR', 'URL is required');
  }

  const resourceId = `res_${randomUUID().slice(0, 12)}`;
  let snapshotPath: string | undefined;
  let fetchedAt: string | undefined;

  const resource: LinkResource = {
    id: resourceId,
    courseId,
    kind: 'link',
    name: trimmed,
    url: trimmed,
    status: 'pending',
    addedAt: new Date().toISOString(),
    indexProgress: 0,
  };

  const store = await readStore();
  store.resources.push(resource);
  await writeStore(store);
  await attachResourceToCourse(courseId, resourceId);

  try {
  const fetched = await fetchUrlAsMarkdown(trimmed, resourceId);
    snapshotPath = fetched.snapshotPath;
    fetchedAt = new Date().toISOString();
    await updateResource(resourceId, {
      name: new URL(trimmed).hostname,
      snapshotPath,
      fetchedAt,
    });
  } catch (error) {
    const errorMessage = error instanceof IpcError ? error.message : 'Link fetch failed';
    await updateResource(resourceId, { status: 'failed', errorMessage });
    throw error;
  }

  const updated = (await getResource(resourceId)) as LinkResource;
  void startIndexing(updated);
  return updated;
}

export async function createNoteResource(
  courseId: string | null,
  noteId: string,
  title: string,
  snapshotPath: string,
): Promise<Resource> {
  const store = await readStore();
  const existing = store.resources.find(
    (r) => r.kind === 'note' && r.noteId === noteId,
  );
  if (existing) {
    return existing;
  }

  const resource = {
    id: `res_${randomUUID().slice(0, 12)}`,
    courseId,
    kind: 'note' as const,
    noteId,
    name: title,
    status: 'pending' as const,
    addedAt: new Date().toISOString(),
    indexProgress: 0,
  };

  store.resources.push(resource);
  await writeStore(store);

  if (courseId) {
    await attachResourceToCourse(courseId, resource.id);
  }

  void startIndexing(resource as Resource);
  return resource as Resource;
}

export async function updateNoteResourceTitle(noteId: string, title: string): Promise<void> {
  const store = await readStore();
  const index = store.resources.findIndex((r) => r.kind === 'note' && r.noteId === noteId);
  if (index >= 0) {
    store.resources[index] = { ...store.resources[index], name: title };
    await writeStore(store);
  }
}

export async function removeResource(id: string): Promise<void> {
  cancelJob(id);
  const store = await readStore();
  const resource = store.resources.find((r) => r.id === id);
  if (!resource) {
    throw new IpcError('NOT_FOUND', 'Resource not found');
  }
  if (resource.courseId) {
    await detachResourceFromCourse(resource.courseId, id);
  }
  await removeChunksForResource(id);
  store.resources = store.resources.filter((r) => r.id !== id);
  await writeStore(store);
}

export async function reindexResource(id: string): Promise<Resource> {
  cancelJob(id);
  const resource = await getResource(id);
  await removeChunksForResource(id);
  const reset = await updateResource(id, {
    status: 'pending',
    indexProgress: 0,
    errorMessage: undefined,
    chunkCount: undefined,
    lastIndexedAt: undefined,
    previewText: undefined,
  });
  void startIndexing(reset);
  return reset;
}

export async function indexResourceNow(resource: Resource): Promise<void> {
  await startIndexing(resource);
}

export async function saveWebSummaryToResources(
  title: string,
  summary: string,
  courseId?: string | null,
): Promise<Resource> {
  const { app } = await import('electron');
  const fs = await import('node:fs/promises');
  const path = await import('node:path');

  const dir = path.join(app.getPath('userData'), 'knowledge-web');
  await fs.mkdir(dir, { recursive: true });

  const safeName = title
    .replace(/[^\w\s-]/g, '')
    .trim()
    .slice(0, 60)
    .replace(/\s+/g, '-') || 'web-summary';
  const fileName = `${safeName}-${Date.now()}.md`;
  const filePath = path.join(dir, fileName);
  const body = `# ${title}\n\n${summary}\n`;
  await fs.writeFile(filePath, body, 'utf8');

  const resource: FileResource = {
    id: `res_${randomUUID().slice(0, 12)}`,
    courseId: courseId ?? null,
    kind: 'file',
    name: fileName,
    path: filePath,
    type: 'md',
    sizeBytes: Buffer.byteLength(body, 'utf8'),
    status: 'pending',
    addedAt: new Date().toISOString(),
    indexProgress: 0,
  };

  const store = await readStore();
  store.resources.push(resource);
  await writeStore(store);

  if (courseId) {
    await attachResourceToCourse(courseId, resource.id);
  }

  await startIndexing(resource);
  return resource;
}

/** Legacy compatibility */
export async function listLibraryFiles(): Promise<Resource[]> {
  return listAllResources();
}

export async function addLibraryFiles(paths: string[]): Promise<Resource[]> {
  const courses = await import('../courses/course-service');
  const all = await courses.listCourses();
  const courseId = all[0]?.id;
  if (!courseId) {
    const created = await courses.createCourse({ name: 'Genel', icon: '📚' });
    return addFilesToCourse(created.id, paths);
  }
  return addFilesToCourse(courseId, paths);
}

export async function removeLibraryFile(id: string): Promise<void> {
  return removeResource(id);
}

export async function reindexLibraryFile(id: string): Promise<Resource> {
  return reindexResource(id);
}

export function initLibraryService(getWindow: () => BrowserWindow): void {
  initResourceService(getWindow);
}

export async function ensureLibrarySeed(): Promise<void> {
  const { ensureKnowledgeSeed } = await import('../rag/seed');
  try {
    const seedEntry = await ensureKnowledgeSeed();
    if (!seedEntry) {
      return;
    }
    const store = await readStore();
    if (store.resources.some((r) => r.kind === 'file' && (r as FileResource).path === seedEntry.path)) {
      return;
    }
    const courses = await import('../courses/course-service');
    let all = await courses.listCourses();
    if (all.length === 0) {
      await courses.createCourse({ name: 'Genel', icon: '📚' });
      all = await courses.listCourses();
    }
    const courseId = all[0]!.id;
    const resource: FileResource = {
      id: seedEntry.id.replace(/^lib_/, 'res_'),
      courseId,
      kind: 'file',
      name: seedEntry.name,
      path: seedEntry.path,
      type: seedEntry.type,
      sizeBytes: seedEntry.sizeBytes,
      status: seedEntry.status,
      addedAt: seedEntry.addedAt,
      indexProgress: 0,
    };
    store.resources.push(resource);
    await writeStore(store);
    await attachResourceToCourse(courseId, resource.id);
    void startIndexing(resource);
  } catch (error) {
    console.error('[escopenote] library seed failed:', error);
  }
}
