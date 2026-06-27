import fs from 'node:fs/promises';
import path from 'node:path';

/** Write via temp file + rename to avoid torn JSON on crash. */
export async function writeFileAtomic(filePath: string, content: string): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const tmp = path.join(dir, `.${path.basename(filePath)}.${process.pid}.tmp`);
  await fs.writeFile(tmp, content, 'utf8');
  await fs.rename(tmp, filePath);
}
