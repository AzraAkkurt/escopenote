import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { DataBackupPayload } from '../../../shared/data-backup-types';
import { IpcError } from '../../../shared/ipc-errors';
import { STORAGE_NAMESPACES } from '../../../shared/storage-namespaces';
import { readNamespace, readSettingsFile, writeNamespace, writeSettingsFile } from './file-store';

export async function exportLocalData(): Promise<DataBackupPayload> {
  const settings = await readSettingsFile();
  const storage: DataBackupPayload['storage'] = {};

  for (const namespace of STORAGE_NAMESPACES) {
    storage[namespace] = (await readNamespace(namespace)) ?? null;
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
    storage,
  };
}

export async function importLocalData(payload: DataBackupPayload): Promise<void> {
  if (payload.version !== 1) {
    throw new IpcError('VALIDATION_ERROR', 'Unsupported backup version');
  }

  await writeSettingsFile(payload.settings);

  for (const namespace of STORAGE_NAMESPACES) {
    if (namespace in payload.storage) {
      const data = payload.storage[namespace];
      if (data !== null && data !== undefined) {
        await writeNamespace(namespace, data);
      }
    }
  }
}

export async function exportToFile(filePath: string): Promise<string> {
  const payload = await exportLocalData();
  const json = JSON.stringify(payload, null, 2);
  await fs.writeFile(filePath, json, 'utf8');
  return filePath;
}

export async function importFromFile(filePath: string): Promise<void> {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, 'utf8');
  } catch {
    throw new IpcError('VALIDATION_ERROR', 'Backup file not found or unreadable');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new IpcError('VALIDATION_ERROR', 'Invalid backup JSON');
  }

  if (!parsed || typeof parsed !== 'object' || (parsed as DataBackupPayload).version !== 1) {
    throw new IpcError('VALIDATION_ERROR', 'Unsupported backup format');
  }

  await importLocalData(parsed as DataBackupPayload);
}

export function defaultBackupPath(): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(app.getPath('documents'), `escopenote-backup-${stamp}.json`);
}
