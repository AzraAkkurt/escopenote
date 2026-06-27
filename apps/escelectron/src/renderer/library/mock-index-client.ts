import type { LibraryFileEntry, LibraryProgressEvent } from '@shared/library-types';

const STEPS = 10;
const STEP_MS = 180;

export function shouldMockFail(fileName: string): boolean {
  return fileName.toLowerCase().includes('.fail.');
}

export function runClientMockIndexing(
  entry: LibraryFileEntry,
  onProgress: (event: LibraryProgressEvent) => void,
): () => void {
  let cancelled = false;
  let step = 0;

  onProgress({ id: entry.id, status: 'indexing', progress: 0 });

  const timer = setInterval(() => {
    if (cancelled) {
      clearInterval(timer);
      return;
    }

    step += 1;
    const progress = Math.round((step / STEPS) * 100);

    if (step < STEPS) {
      onProgress({ id: entry.id, status: 'indexing', progress });
      return;
    }

    clearInterval(timer);

    if (shouldMockFail(entry.name)) {
      onProgress({
        id: entry.id,
        status: 'failed',
        progress: 0,
        errorMessage: 'Mock indexing failed (filename contains ".fail.")',
      });
      return;
    }

    const chunkCount = Math.max(4, Math.floor(entry.name.length * 1.7) % 120);
    onProgress({
      id: entry.id,
      status: 'ready',
      progress: 100,
      chunkCount,
      lastIndexedAt: new Date().toISOString(),
      previewText: `[Preview] First lines from "${entry.name}"…`,
    });
  }, STEP_MS);

  return () => {
    cancelled = true;
    clearInterval(timer);
  };
}
