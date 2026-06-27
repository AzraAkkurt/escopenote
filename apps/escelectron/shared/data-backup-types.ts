import type { AppSettings } from './settings';
import type { StorageNamespace } from './storage-namespaces';

export interface DataBackupPayload {
  version: 1;
  exportedAt: string;
  settings: AppSettings;
  storage: Partial<Record<StorageNamespace, unknown>>;
}
