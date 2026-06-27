import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { IpcError } from '../../../shared/ipc-errors';

const MAX_BYTES = 2 * 1024 * 1024;
const TIMEOUT_MS = 15_000;

function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.local')) {
    return true;
  }
  if (h === '127.0.0.1' || h === '::1' || h === '0.0.0.0') {
    return true;
  }
  const parts = h.split('.').map(Number);
  if (parts.length === 4 && parts.every((n) => !Number.isNaN(n))) {
    if (parts[0] === 10) {
      return true;
    }
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
      return true;
    }
    if (parts[0] === 192 && parts[1] === 168) {
      return true;
    }
  }
  return false;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function validateFetchUrl(urlString: string): URL {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new IpcError('VALIDATION_ERROR', 'Invalid URL');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new IpcError('VALIDATION_ERROR', 'Only http and https URLs are allowed');
  }
  if (isPrivateHost(url.hostname)) {
    throw new IpcError('VALIDATION_ERROR', 'Local or private network URLs are not allowed');
  }
  return url;
}

export async function fetchUrlAsMarkdown(urlString: string, resourceId: string): Promise<{
  markdown: string;
  snapshotPath: string;
}> {
  const url = validateFetchUrl(urlString);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url.href, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Escopenote/1.0 (desktop link indexer)' },
      redirect: 'follow',
    });
  } catch (error) {
    clearTimeout(timer);
    const msg = error instanceof Error ? error.message : 'Fetch failed';
    throw new IpcError('GATEWAY_ERROR', `Could not fetch URL: ${msg}`);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new IpcError('GATEWAY_ERROR', `URL returned HTTP ${res.status}`);
  }

  const buffer = await res.arrayBuffer();
  if (buffer.byteLength > MAX_BYTES) {
    throw new IpcError('VALIDATION_ERROR', 'Page too large to index (max 2MB)');
  }

  const contentType = res.headers.get('content-type') ?? '';
  const body = new TextDecoder('utf-8').decode(buffer);
  let text: string;

  if (contentType.includes('text/html') || body.trimStart().startsWith('<')) {
    text = stripHtml(body);
  } else {
    text = body;
  }

  if (!text.trim()) {
    throw new IpcError('VALIDATION_ERROR', 'No extractable text from URL');
  }

  const dir = path.join(app.getPath('userData'), 'knowledge-links');
  await fs.mkdir(dir, { recursive: true });
  const snapshotPath = path.join(dir, `${resourceId}.md`);
  const markdown = `# ${url.hostname}\n\nSource: ${url.href}\n\n${text.slice(0, 500_000)}`;
  await fs.writeFile(snapshotPath, markdown, 'utf8');

  return { markdown, snapshotPath };
}
