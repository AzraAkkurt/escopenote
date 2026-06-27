import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { LibraryFileEntry, LibraryFileType } from '../../../shared/library-types';
import { IpcError } from '../../../shared/ipc-errors';

const EXT_TO_TYPE: Record<string, LibraryFileType> = {
  pdf: 'pdf',
  html: 'html',
  htm: 'html',
  txt: 'txt',
  md: 'md',
  markdown: 'md',
  csv: 'csv',
  json: 'json',
  docx: 'docx',
};

const SUPPORTED_EXTENSIONS = new Set(Object.keys(EXT_TO_TYPE));

export function detectFileType(filePath: string): LibraryFileType {
  const ext = path.extname(filePath).replace(/^\./, '').toLowerCase();
  return EXT_TO_TYPE[ext] ?? 'unknown';
}

export function isSupportedLibraryPath(filePath: string): boolean {
  const ext = path.extname(filePath).replace(/^\./, '').toLowerCase();
  return SUPPORTED_EXTENSIONS.has(ext);
}

const SUPPORTED_LIST = [...SUPPORTED_EXTENSIONS].join(', ');

export async function buildEntryFromPath(filePath: string): Promise<LibraryFileEntry> {
  if (!isSupportedLibraryPath(filePath)) {
    throw new IpcError(
      'VALIDATION_ERROR',
      `Unsupported file type: ${path.basename(filePath)}. Supported: ${SUPPORTED_LIST}`,
    );
  }

  let stat;
  try {
    stat = await fs.stat(filePath);
  } catch {
    throw new IpcError('VALIDATION_ERROR', `File not found: ${filePath}`);
  }

  if (!stat.isFile()) {
    throw new IpcError('VALIDATION_ERROR', `Not a file: ${filePath}`);
  }

  return {
    id: `lib_${randomUUID()}`,
    name: path.basename(filePath),
    path: filePath,
    type: detectFileType(filePath),
    sizeBytes: stat.size,
    status: 'pending',
    addedAt: new Date().toISOString(),
    indexProgress: 0,
  };
}

