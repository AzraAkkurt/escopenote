export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'PROVIDER_UNAVAILABLE'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR';

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    retryable: boolean;
    details?: Record<string, unknown>;
  };
}

export interface SseErrorEvent {
  type: 'error';
  error: {
    code: ApiErrorCode;
    message: string;
    retryable: boolean;
  };
}
