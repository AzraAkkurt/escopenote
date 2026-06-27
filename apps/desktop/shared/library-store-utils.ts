import type { LibraryFileEntry, LibraryFileType, LibraryIndexStatus, LibraryIndexStore } from './library-types';

const VALID_TYPES = new Set<LibraryFileType>([
  'pdf',
  'html',
  'txt',
  'md',
  'csv',
  'json',
  'docx',
  'unknown',
]);

const VALID_STATUS = new Set<LibraryIndexStatus>(['pending', 'indexing', 'ready', 'failed']);

function repairEntry(value: unknown): LibraryFileEntry | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Partial<LibraryFileEntry>;
  if (typeof raw.id !== 'string' || typeof raw.name !== 'string') {
    return null;
  }

  const type = VALID_TYPES.has(raw.type as LibraryFileType)
    ? (raw.type as LibraryFileType)
    : 'unknown';
  const status = VALID_STATUS.has(raw.status as LibraryIndexStatus)
    ? (raw.status as LibraryIndexStatus)
    : 'ready';

  return {
    id: raw.id,
    name: raw.name,
    path: typeof raw.path === 'string' ? raw.path : `/legacy/${raw.name}`,
    type,
    sizeBytes: typeof raw.sizeBytes === 'number' ? raw.sizeBytes : 0,
    status,
    addedAt: typeof raw.addedAt === 'string' ? raw.addedAt : new Date().toISOString(),
    errorMessage: raw.errorMessage,
    chunkCount: raw.chunkCount,
    lastIndexedAt: raw.lastIndexedAt,
    previewText: raw.previewText,
    indexProgress: raw.indexProgress,
  };
}

/** Normalize on-disk data (supports legacy array shape and partial entries). */
export function normalizeLibraryStore(data: unknown): LibraryIndexStore {
  const source = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as LibraryIndexStore).files)
      ? (data as LibraryIndexStore).files
      : [];

  const files: LibraryFileEntry[] = [];
  for (const item of source) {
    const entry = repairEntry(item);
    if (entry) {
      files.push(entry);
    }
  }

  return { files };
}
