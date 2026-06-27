import { randomUUID } from 'node:crypto';
import { app } from 'electron';
import path from 'node:path';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const CLIENT_ID_FILE = 'client-id.json';

function clientIdPath(): string {
  return path.join(app.getPath('userData'), CLIENT_ID_FILE);
}

export async function getClientId(): Promise<string> {
  const filePath = clientIdPath();
  try {
    const raw = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as { clientId?: string };
    if (parsed.clientId && parsed.clientId.length > 0) {
      return parsed.clientId;
    }
  } catch {
    // generate below
  }

  const clientId = randomUUID();
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify({ clientId }, null, 2), 'utf8');
  return clientId;
}
