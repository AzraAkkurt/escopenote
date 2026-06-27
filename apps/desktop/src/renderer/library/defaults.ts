import type { LibraryFileEntry, LibraryIndexStore } from '@shared/library-types';
export { normalizeLibraryStore } from '@shared/library-store-utils';

export function createLibraryFileId(): string {
  return `lib_${crypto.randomUUID()}`;
}

export function mergeProgress(
  files: LibraryFileEntry[],
  event: {
    id: string;
    status: LibraryFileEntry['status'];
    progress: number;
    errorMessage?: string;
    chunkCount?: number;
    lastIndexedAt?: string;
    previewText?: string;
  },
): LibraryFileEntry[] {
  return files.map((f) =>
    f.id === event.id
      ? {
          ...f,
          status: event.status,
          indexProgress: event.progress,
          errorMessage: event.errorMessage,
          chunkCount: event.chunkCount,
          lastIndexedAt: event.lastIndexedAt,
          previewText: event.previewText,
        }
      : f,
  );
}
