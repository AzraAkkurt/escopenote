import type { ZodType } from 'zod';
import { IpcError } from '../../../shared/ipc-errors';

export function parseOrThrow<T>(schema: ZodType<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new IpcError('VALIDATION_ERROR', `${label}: ${message}`);
  }
  return result.data;
}
