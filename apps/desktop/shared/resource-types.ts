import type { LibraryIndexStatus, LibraryFileType } from './library-types';

export type ResourceKind = 'file' | 'link' | 'note';

export interface ResourceBase {
  id: string;
  courseId: string | null;
  kind: ResourceKind;
  name: string;
  status: LibraryIndexStatus;
  addedAt: string;
  chunkCount?: number;
  lastIndexedAt?: string;
  errorMessage?: string;
  indexProgress?: number;
  previewText?: string;
}

export interface FileResource extends ResourceBase {
  kind: 'file';
  path: string;
  type: LibraryFileType;
  sizeBytes: number;
}

export interface LinkResource extends ResourceBase {
  kind: 'link';
  url: string;
  fetchedAt?: string;
  snapshotPath?: string;
}

export interface NoteResource extends ResourceBase {
  kind: 'note';
  noteId: string;
}

export type Resource = FileResource | LinkResource | NoteResource;

export interface ResourcesStore {
  resources: Resource[];
}

export interface ResourceProgressEvent {
  id: string;
  status: LibraryIndexStatus;
  progress: number;
  errorMessage?: string;
  chunkCount?: number;
  lastIndexedAt?: string;
  previewText?: string;
}

export function isFileResource(r: Resource): r is FileResource {
  return r.kind === 'file';
}

export function isLinkResource(r: Resource): r is LinkResource {
  return r.kind === 'link';
}

export function isNoteResource(r: Resource): r is NoteResource {
  return r.kind === 'note';
}
