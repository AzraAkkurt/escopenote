import type { ServerResponse } from 'node:http';
import type { ChatSseServerEvent } from '@escopenote/contracts';

export function initSse(res: ServerResponse): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
}

export function writeSse(res: ServerResponse, event: ChatSseServerEvent): void {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

export function endSse(res: ServerResponse): void {
  res.end();
}
