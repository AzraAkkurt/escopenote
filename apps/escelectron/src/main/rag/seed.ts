import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { LibraryFileEntry } from '../../../shared/library-types';
import { getChunkCount } from './vector-store';

const SEED_CONTENT = `# Mathematics final study guide

Exam covers chapters 3–5. Focus on problem sets 3.1–3.4 and the summary sheet.

## Cancellation policy

Assignments may be rescheduled with at least 48 hours notice before the due date.

## Study tips

Use 25–45 minute blocks with short breaks. Review definitions from your notes before practice problems.
`;

export async function ensureKnowledgeSeed(): Promise<LibraryFileEntry | null> {
  const count = await getChunkCount();
  if (count > 0) {
    return null;
  }

  const seedDir = path.join(app.getPath('userData'), 'knowledge-seed');
  await fs.mkdir(seedDir, { recursive: true });
  const seedPath = path.join(seedDir, 'study-guide.md');
  await fs.writeFile(seedPath, SEED_CONTENT, 'utf8');

  return {
    id: `lib_${randomUUID()}`,
    name: 'study-guide.md',
    path: seedPath,
    type: 'md',
    sizeBytes: Buffer.byteLength(SEED_CONTENT, 'utf8'),
    status: 'pending',
    addedAt: new Date().toISOString(),
    indexProgress: 0,
  };
}
