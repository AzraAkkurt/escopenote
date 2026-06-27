import type { LibraryFileType } from '@shared/library-types';

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatAddedDate(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleString(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export function fileTypeLabel(type: LibraryFileType): string {
  return type.toUpperCase();
}

export const LIBRARY_FILE_FILTERS = [
  {
    name: 'Documents',
    extensions: ['pdf', 'html', 'htm', 'txt', 'md', 'csv', 'json', 'docx'],
  },
];
