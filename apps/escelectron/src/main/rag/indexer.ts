import { IpcError } from '../../../shared/ipc-errors';
import type { ResourceProgressEvent } from '../../../shared/resource-types';
import type { Resource } from '../../../shared/resource-types';
import { isFileResource, isLinkResource, isNoteResource } from '../../../shared/resource-types';
import type { RagStoredChunk } from '../../../shared/rag-types';
import { chunkText } from './chunker';
import { createChunkId, embedText } from './embedder';
import { parseFileToText } from './parser';
import { replaceChunksForResource } from './vector-store';

export interface IndexProgressCallback {
  (event: ResourceProgressEvent): void;
}

async function getTextForResource(resource: Resource): Promise<string> {
  if (isFileResource(resource)) {
    return parseFileToText(resource.path, resource.type);
  }
  if (isLinkResource(resource)) {
    if (!resource.snapshotPath) {
      throw new IpcError('VALIDATION_ERROR', 'Link has no snapshot');
    }
    return parseFileToText(resource.snapshotPath, 'md');
  }
  if (isNoteResource(resource)) {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const { app } = await import('electron');
    const notePath = path.join(app.getPath('userData'), 'knowledge-notes', `${resource.noteId}.md`);
    return parseFileToText(notePath, 'md');
  }
  throw new IpcError('VALIDATION_ERROR', 'Unknown resource kind');
}

export async function indexResource(
  resource: Resource,
  onProgress: IndexProgressCallback,
  isCancelled: () => boolean,
): Promise<{ ok: true; chunkCount: number; previewText: string } | { ok: false; errorMessage: string }> {
  const emit = (progress: number, status: ResourceProgressEvent['status'] = 'indexing') => {
    onProgress({ id: resource.id, status, progress });
  };

  try {
    emit(5, 'indexing');
    if (isCancelled()) {
      return { ok: false, errorMessage: 'Indexing cancelled' };
    }

    const text = await getTextForResource(resource);
    if (!text.trim()) {
      const errorMessage = 'No extractable text';
      onProgress({ id: resource.id, status: 'failed', progress: 0, errorMessage });
      return { ok: false, errorMessage };
    }

    emit(30, 'indexing');
    if (isCancelled()) {
      return { ok: false, errorMessage: 'Indexing cancelled' };
    }

    const parts = chunkText(text);
    if (parts.length === 0) {
      const errorMessage = 'No chunks produced';
      onProgress({ id: resource.id, status: 'failed', progress: 0, errorMessage });
      return { ok: false, errorMessage };
    }

    emit(55, 'indexing');
    if (isCancelled()) {
      return { ok: false, errorMessage: 'Indexing cancelled' };
    }

    const stored: RagStoredChunk[] = parts.map((part, index) => ({
      id: createChunkId(),
      fileId: resource.id,
      resourceId: resource.id,
      fileName: resource.name,
      text: part,
      chunkIndex: index,
      courseId: resource.courseId,
      resourceKind: resource.kind,
      noteId: isNoteResource(resource) ? resource.noteId : undefined,
      embedding: embedText(part),
    }));

    emit(80, 'indexing');
    await replaceChunksForResource(resource.id, stored);

    if (isCancelled()) {
      return { ok: false, errorMessage: 'Indexing cancelled' };
    }

    const previewText = stored[0]?.text.slice(0, 400) ?? '';
    const lastIndexedAt = new Date().toISOString();

    onProgress({
      id: resource.id,
      status: 'ready',
      progress: 100,
      chunkCount: stored.length,
      lastIndexedAt,
      previewText,
    });

    return { ok: true, chunkCount: stored.length, previewText };
  } catch (error) {
    const errorMessage =
      error instanceof IpcError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Indexing failed unexpectedly';
    onProgress({ id: resource.id, status: 'failed', progress: 0, errorMessage });
    return { ok: false, errorMessage };
  }
}

/** @deprecated use indexResource */
export async function indexLibraryFile(
  entry: { id: string; name: string; path: string; type: import('../../../shared/library-types').LibraryFileType; courseId?: string | null },
  onProgress: IndexProgressCallback,
  isCancelled: () => boolean,
) {
  const resource: Resource = {
    id: entry.id,
    courseId: entry.courseId ?? null,
    kind: 'file',
    name: entry.name,
    path: entry.path,
    type: entry.type,
    sizeBytes: 0,
    status: 'indexing',
    addedAt: new Date().toISOString(),
  };
  return indexResource(resource, onProgress, isCancelled);
}
