import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { AppSettings } from '../../../shared/settings';
import { DEFAULT_SETTINGS, migrateGatewayUrl } from '../../../shared/settings';
import type { StorageNamespace } from '../../../shared/storage-namespaces';
import { IpcError } from '../../../shared/ipc-errors';
import { writeFileAtomic } from './atomic-write';

const SETTINGS_FILE = 'settings.json';

function getStorageDir(): string {
  return path.join(app.getPath('userData'), 'storage');
}

function getSettingsPath(): string {
  return path.join(app.getPath('userData'), SETTINGS_FILE);
}

function namespacePath(namespace: StorageNamespace): string {
  return path.join(getStorageDir(), `${namespace}.json`);
}

async function ensureStorageDir(): Promise<void> {
  await fs.mkdir(getStorageDir(), { recursive: true });
}

export async function readSettingsFile(): Promise<AppSettings> {
  const filePath = getSettingsPath();
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const merged = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as AppSettings;
    return { ...merged, gatewayUrl: migrateGatewayUrl(merged.gatewayUrl) };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { ...DEFAULT_SETTINGS };
    }
    throw new IpcError('STORAGE_ERROR', 'Failed to read settings');
  }
}

export async function writeSettingsFile(settings: AppSettings): Promise<void> {
  const filePath = getSettingsPath();
  const normalized = { ...settings, gatewayUrl: migrateGatewayUrl(settings.gatewayUrl) };
  try {
    await writeFileAtomic(filePath, JSON.stringify(normalized, null, 2));
  } catch {
    throw new IpcError('STORAGE_ERROR', 'Failed to write settings');
  }
}

export async function readNamespace<T>(namespace: StorageNamespace): Promise<T | null> {
  await ensureStorageDir();
  const filePath = namespacePath(namespace);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw new IpcError('STORAGE_ERROR', `Failed to read storage: ${namespace}`);
  }
}

export async function writeNamespace<T>(namespace: StorageNamespace, data: T): Promise<void> {
  await ensureStorageDir();
  const filePath = namespacePath(namespace);
  try {
    await writeFileAtomic(filePath, JSON.stringify(data, null, 2));
  } catch {
    throw new IpcError('STORAGE_ERROR', `Failed to write storage: ${namespace}`);
  }
}
