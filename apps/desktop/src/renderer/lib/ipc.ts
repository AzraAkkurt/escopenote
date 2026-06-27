import { unwrapInvokeError } from '@shared/ipc-errors';
import type { EscopenoteApi } from '@shared/ipc-types';

export function getApi(): EscopenoteApi {
  if (!window.escopenote) {
    throw new Error('Escopenote preload API is not available');
  }
  return window.escopenote;
}

export async function ipcCall<T>(fn: (api: EscopenoteApi) => Promise<T>): Promise<T> {
  try {
    return await fn(getApi());
  } catch (error) {
    throw unwrapInvokeError(error);
  }
}

export { isIpcError, formatInvokeError } from '@shared/ipc-errors';
