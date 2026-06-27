export type IpcErrorCode =
  | 'VALIDATION_ERROR'
  | 'STORAGE_ERROR'
  | 'NOT_FOUND'
  | 'DIALOG_ERROR'
  | 'INTERNAL_ERROR'
  | 'GATEWAY_UNAVAILABLE'
  | 'GATEWAY_UNAUTHORIZED'
  | 'GATEWAY_RATE_LIMIT'
  | 'GATEWAY_TIMEOUT'
  | 'GATEWAY_ERROR';

export class IpcError extends Error {
  readonly code: IpcErrorCode;

  constructor(code: IpcErrorCode, message: string) {
    super(message);
    this.name = 'IpcError';
    this.code = code;
  }
}

export function isIpcError(error: unknown): error is IpcError {
  return error instanceof IpcError;
}

export interface IpcErrorPayload {
  code: IpcErrorCode;
  message: string;
}

export function ipcErrorFromPayload(payload: IpcErrorPayload): IpcError {
  return new IpcError(payload.code, payload.message);
}

/** Reject over IPC so Electron preserves code + message (plain objects become [object Object]). */
export function rejectIpc(payload: IpcErrorPayload): IpcError {
  return new IpcError(payload.code, payload.message);
}

export function isIpcErrorPayload(value: unknown): value is IpcErrorPayload {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as IpcErrorPayload).code === 'string' &&
    typeof (value as IpcErrorPayload).message === 'string'
  );
}

/** Unwrap errors from ipcRenderer.invoke (Electron wraps non-Error rejects). */
export function unwrapInvokeError(error: unknown): IpcError | Error {
  if (isIpcError(error)) {
    return error;
  }

  if (isIpcErrorPayload(error)) {
    return ipcErrorFromPayload(error);
  }

  if (error instanceof Error) {
    const withCode = error as Error & { code?: string };
    if (withCode.code && isIpcErrorPayload({ code: withCode.code, message: error.message })) {
      return ipcErrorFromPayload({
        code: withCode.code as IpcErrorCode,
        message: error.message,
      });
    }
  }

  return error instanceof Error ? error : new Error(String(error));
}

export function formatInvokeError(error: unknown): string {
  const unwrapped = unwrapInvokeError(error);
  return unwrapped.message;
}
