const isDev = process.env.NODE_ENV === 'development';

function redactPath(value: string): string {
  if (isDev) {
    return value;
  }
  const parts = value.replace(/\\/g, '/').split('/');
  return parts.length > 2 ? `…/${parts.slice(-2).join('/')}` : '…';
}

function sanitizeArg(arg: unknown): unknown {
  if (typeof arg === 'string' && (arg.includes('/') || arg.includes('\\'))) {
    return redactPath(arg);
  }
  if (Array.isArray(arg)) {
    return arg.map(sanitizeArg);
  }
  if (arg && typeof arg === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(arg)) {
      if (key.toLowerCase().includes('path') && typeof val === 'string') {
        out[key] = redactPath(val);
      } else {
        out[key] = sanitizeArg(val);
      }
    }
    return out;
  }
  return arg;
}

export function logIpc(channel: string, direction: 'in' | 'out', payload?: unknown): void {
  if (!isDev) {
    return;
  }
  const prefix = direction === 'in' ? '→' : '←';
  if (payload === undefined) {
    console.debug(`[ipc] ${prefix} ${channel}`);
    return;
  }
  console.debug(`[ipc] ${prefix} ${channel}`, sanitizeArg(payload));
}
