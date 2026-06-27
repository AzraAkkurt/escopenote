import type { Resource } from '../../../shared/resource-types';
import { indexResourceNow } from '../resources/resource-service';

const INDEX_DEBOUNCE_MS = 3000;

const timers = new Map<string, ReturnType<typeof setTimeout>>();

async function resolveNoteResource(noteId: string): Promise<Resource | null> {
  const resources = await import('../resources/resource-service');
  const all = await resources.listAllResources();
  return all.find((r) => r.kind === 'note' && r.noteId === noteId) ?? null;
}

async function runNoteIndex(noteId: string): Promise<void> {
  const resource = await resolveNoteResource(noteId);
  if (!resource) {
    return;
  }
  await new Promise<void>((resolve) => {
    setImmediate(() => resolve());
  });
  await indexResourceNow(resource);
}

/**
 * RAG indekslemesini yazma durduktan 3 sn sonra arka planda çalıştırır.
 * Her not için ayrı zamanlayıcı; hızlı ardışık düzenlemeler tek indeksle birleşir.
 */
export function scheduleNoteIndex(noteId: string): void {
  const existing = timers.get(noteId);
  if (existing) {
    clearTimeout(existing);
  }

  timers.set(
    noteId,
    setTimeout(() => {
      timers.delete(noteId);
      void runNoteIndex(noteId).catch((err) => {
        console.error('[note-index]', noteId, err);
      });
    }, INDEX_DEBOUNCE_MS),
  );
}

export function cancelScheduledNoteIndex(noteId: string): void {
  const existing = timers.get(noteId);
  if (existing) {
    clearTimeout(existing);
    timers.delete(noteId);
  }
}
