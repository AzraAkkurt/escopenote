export type LibraryIndexStatus = 'pending' | 'indexing' | 'ready' | 'failed';

export type LibraryFileType =
  | 'pdf'
  | 'html'
  | 'txt'
  | 'md'
  | 'csv'
  | 'json'
  | 'docx'
  | 'unknown';

export interface LibraryFileEntry {
  id: string;
  name: string;
  path: string;
  type: LibraryFileType;
  sizeBytes: number;
  status: LibraryIndexStatus;
  addedAt: string;
  errorMessage?: string;
  chunkCount?: number;
  lastIndexedAt?: string;
  previewText?: string;
  indexProgress?: number;
}

export interface LibraryIndexStore {
  files: LibraryFileEntry[];
}

export interface LibraryProgressEvent {
  id: string;
  status: LibraryIndexStatus;
  progress: number;
  errorMessage?: string;
  chunkCount?: number;
  lastIndexedAt?: string;
  previewText?: string;
}
