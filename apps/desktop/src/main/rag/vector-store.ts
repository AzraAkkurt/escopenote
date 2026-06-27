import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { RagIndexData, RagStoredChunk } from '../../../shared/rag-types';
import { IpcError } from '../../../shared/ipc-errors';
import { writeFileAtomic } from '../storage/atomic-write';

const INDEX_FILE = 'rag-index.json';

function indexPath(): string {
  return path.join(app.getPath('userData'), INDEX_FILE);
}

async function readRaw(): Promise<RagIndexData> {
  try {
    const raw = await fs.readFile(indexPath(), 'utf8');
    const data = JSON.parse(raw) as RagIndexData;
    if (data?.version === 1 && Array.isArray(data.chunks)) {
      return data;
    }
    return { version: 1, chunks: [] };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { version: 1, chunks: [] };
    }
    throw new IpcError('STORAGE_ERROR', 'Failed to read RAG index');
  }
}

async function writeRaw(data: RagIndexData): Promise<void> {
  try {
    await writeFileAtomic(indexPath(), JSON.stringify(data, null, 2));
  } catch {
    throw new IpcError('STORAGE_ERROR', 'Failed to write RAG index');
  }
}

export async function listChunks(): Promise<RagStoredChunk[]> {
  const data = await readRaw();
  return data.chunks;
}

export async function getChunkById(chunkId: string): Promise<RagStoredChunk | null> {
  const data = await readRaw();
  return data.chunks.find((c) => c.id === chunkId) ?? null;
}

export async function removeChunksForFile(fileId: string): Promise<void> {
  return removeChunksForResource(fileId);
}

export async function removeChunksForResource(resourceId: string): Promise<void> {
  const data = await readRaw();
  const next = data.chunks.filter(
    (c) => c.resourceId !== resourceId && c.fileId !== resourceId,
  );
  if (next.length !== data.chunks.length) {
    await writeRaw({ version: 1, chunks: next });
  }
}

export async function replaceChunksForFile(
  fileId: string,
  chunks: RagStoredChunk[],
): Promise<void> {
  return replaceChunksForResource(fileId, chunks);
}

export async function replaceChunksForResource(
  resourceId: string,
  chunks: RagStoredChunk[],
): Promise<void> {
  const data = await readRaw();
  const kept = data.chunks.filter(
    (c) => c.resourceId !== resourceId && c.fileId !== resourceId,
  );
  await writeRaw({ version: 1, chunks: [...kept, ...chunks] });
}

export async function getChunkCount(): Promise<number> {
  const data = await readRaw();
  return data.chunks.length;
}
