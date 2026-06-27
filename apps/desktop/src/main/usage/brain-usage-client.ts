import type { UsageQuotaInfo } from '../../../shared/gateway-types';
import { mapFetchError, mapHttpError } from '../api/gateway-client';
import { readSettingsFile } from '../storage/file-store';
import { IpcError } from '../../../shared/ipc-errors';

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

export async function brainGetUsage(clientId: string): Promise<UsageQuotaInfo> {
  const settings = await readSettingsFile();
  const base = normalizeBaseUrl(settings.gatewayUrl);
  let res: Response;
  try {
    res = await fetch(`${base}/v1/usage`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Client-Id': clientId,
      },
    });
  } catch (error) {
    const payload = mapFetchError(error);
    throw new IpcError(payload.code, payload.message);
  }

  if (!res.ok) {
    const text = await res.text();
    let body: { error?: { message?: string } } = {};
    try {
      body = JSON.parse(text) as { error?: { message?: string } };
    } catch {
      // ignore
    }
    const payload = mapHttpError(res.status, body.error?.message ?? text);
    throw new IpcError(payload.code, payload.message);
  }

  return (await res.json()) as UsageQuotaInfo;
}
