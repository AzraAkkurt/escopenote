import { isIpcError } from '@renderer/lib/ipc';
import type { RequestErrorPayload } from '@shared/gateway-types';
import type { TFunction } from 'i18next';

export function isRequestErrorPayload(error: unknown): error is RequestErrorPayload {
  return (
    !!error &&
    typeof error === 'object' &&
    'code' in error &&
    'message' in error &&
    'retryable' in error
  );
}

export function getRequestErrorMessage(error: unknown, t: TFunction): string {
  if (isIpcError(error)) {
    const key = `gateway.errors.${error.code}`;
    const translated = t(key, { defaultValue: '' });
    if (translated) {
      return translated;
    }
    return error.message;
  }
  if (isRequestErrorPayload(error)) {
    const key = `gateway.errors.${error.code}`;
    const translated = t(key, { defaultValue: '' });
    return translated || error.message;
  }
  return error instanceof Error ? error.message : t('gateway.errors.GATEWAY_ERROR');
}

export function isRetryableRequestError(error: unknown): boolean {
  if (isRequestErrorPayload(error)) {
    return error.retryable;
  }
  if (isIpcError(error)) {
    return [
      'GATEWAY_UNAVAILABLE',
      'GATEWAY_TIMEOUT',
      'GATEWAY_RATE_LIMIT',
      'GATEWAY_ERROR',
    ].includes(error.code);
  }
  return false;
}
