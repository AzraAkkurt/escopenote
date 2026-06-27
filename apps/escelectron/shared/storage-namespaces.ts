export const STORAGE_NAMESPACES = [
  'courses.index',
  'resources.index',
  'notes.index',
  'notes.tabs',
  'chat.sessions',
  'library.index',
] as const;

export type StorageNamespace = (typeof STORAGE_NAMESPACES)[number];

export function isStorageNamespace(value: string): value is StorageNamespace {
  return (STORAGE_NAMESPACES as readonly string[]).includes(value);
}
