#!/usr/bin/env node
/**
 * Escopenote dev AI gateway (Phase 9).
 * No API keys — simulates Gemini orchestration for local desktop development.
 *
 *   node apps/gateway/server.mjs
 *   ESCOPENOTE_GATEWAY_PORT=3000
 */
import http from 'node:http';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.ESCOPENOTE_GATEWAY_PORT ?? 3000);

const DIFFICULTY_WEIGHT = { easy: 1, medium: 2, hard: 3 };

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function weightedSubjects(subjects) {
  const named = subjects.filter((s) => s.name?.trim());
  const expanded = [];
  for (const s of named) {
    const w = DIFFICULTY_WEIGHT[s.difficulty] ?? 2;
    for (let i = 0; i < w; i++) {
      expanded.push(s);
    }
  }
  return expanded;
}

function addDays(iso, days) {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function generatePlan({ profile, scope, anchorDate }) {
  const pool = weightedSubjects(profile.subjects ?? []);
  const blocks = [];

  if (scope === 'day') {
    const blockCount = profile.busyWeek ? Math.min(4, pool.length || 2) : Math.min(6, pool.length || 3);
    const perBlock = Math.floor(Math.min(profile.hoursPerDay * 60, 480) / blockCount);
    for (let i = 0; i < blockCount; i++) {
      const subject = pool[i % pool.length] ?? { id: 's0', name: 'Study' };
      const hour = 9 + Math.floor((i * perBlock) / 60);
      const minute = (i * perBlock) % 60;
      blocks.push({
        id: `blk_${randomUUID().slice(0, 8)}`,
        subjectId: subject.id,
        subjectName: subject.name,
        title: `${subject.name} — Session ${i + 1}`,
        startTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        durationMinutes: perBlock,
        date: anchorDate,
      });
    }
  } else {
    const days = profile.busyWeek ? 5 : 7;
    const minutesPerDay = Math.floor((profile.hoursPerWeek * 60) / days);
    const blocksPerDay = profile.busyWeek ? 1 : 2;
    const perBlock = Math.floor(minutesPerDay / blocksPerDay);
    for (let day = 0; day < days; day++) {
      const date = addDays(anchorDate, day);
      for (let b = 0; b < blocksPerDay; b++) {
        const subject = pool[(day * blocksPerDay + b) % pool.length] ?? { id: 's0', name: 'Study' };
        blocks.push({
          id: `blk_${randomUUID().slice(0, 8)}`,
          subjectId: subject.id,
          subjectName: subject.name,
          title: `${subject.name} — Day ${day + 1}`,
          durationMinutes: perBlock,
          dayIndex: day,
          date,
        });
      }
    }
  }

  return {
    id: `plan_${randomUUID().slice(0, 8)}`,
    scope,
    anchorDate,
    blocks,
    generatedAt: new Date().toISOString(),
  };
}

function buildLocalAnswer(message, chunks) {
  const intro = 'Based on your indexed documents:\n\n';
  const body = chunks
    .map((c, i) => `${i + 1}. **${c.fileName}**: ${c.text.slice(0, 280).trim()}`)
    .join('\n\n');
  return `${intro}${body}\n\n_Relevant excerpts only were used — not full files._`;
}

function buildWebAnswer(message) {
  return (
    `I could not find enough local context for: "${message.slice(0, 120)}". ` +
    `Here is a concise summary from public sources (dev gateway mock). ` +
    `You can save this to your library for future on-device retrieval.`
  );
}

function citationsFromChunks(chunks) {
  return chunks.map((c) => ({
    id: `cit_${randomUUID().slice(0, 8)}`,
    chunkId: c.chunkId,
    sourceType: 'local',
    fileName: c.fileName,
    excerpt: c.text.slice(0, 320).trim(),
  }));
}

function writeSse(res, event) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

async function handleChatStream(body, res) {
  const { message, relevant_chunks: chunks = [] } = body;
  const forceWeb = /\b(web|internet|search online)\b/i.test(message);
  const useWeb = forceWeb || chunks.length === 0;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  if (useWeb) {
    writeSse(res, {
      type: 'research',
      query: message.slice(0, 80),
      snippet: 'Searching public sources for additional context…',
    });
    await new Promise((r) => setTimeout(r, 200));
    writeSse(res, {
      type: 'thinking',
      delta: 'Local knowledge is insufficient. Reviewing web results and synthesizing an answer.\n',
    });
    await new Promise((r) => setTimeout(r, 150));
  } else if (chunks.length > 0) {
    writeSse(res, {
      type: 'thinking',
      delta: `Found ${chunks.length} relevant chunk(s) in your library. Composing answer from sources.\n`,
    });
    await new Promise((r) => setTimeout(r, 100));
  }

  const full = useWeb ? buildWebAnswer(message) : buildLocalAnswer(message, chunks);
  const tokens = full.split(/(\s+|\n)/).filter((t) => t.length > 0);
  let built = '';

  for (const token of tokens) {
    built += token;
    writeSse(res, { type: 'delta', delta: token });
    await new Promise((r) => setTimeout(r, 10));
  }

  if (useWeb) {
    writeSse(res, {
      type: 'done',
      content: built.trim(),
      sourceType: 'web',
      thinking: 'Local RAG coverage was low; used web research to supplement the answer.',
      citations: [
        {
          id: `cit_${randomUUID().slice(0, 8)}`,
          sourceType: 'web',
          fileName: 'example.com/article',
          excerpt: 'Public article excerpt used when local RAG has insufficient coverage.',
        },
      ],
      pendingWebSave: {
        title: `Web: ${message.slice(0, 48).trim()}`,
        summary: `Summary for "${message}": key facts gathered from web research (mock). Exam topics often include chapters 3–5 with emphasis on problem sets.`,
      },
    });
  } else {
    writeSse(res, {
      type: 'done',
      content: built.trim(),
      sourceType: 'local',
      citations: citationsFromChunks(chunks),
    });
  }

  res.end();
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${PORT}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    sendJson(res, 200, {
      ok: true,
      version: '0.2.0-dev',
      api: 'v1',
      capabilities: ['chat.stream', 'planner.generate'],
      provider: 'mock',
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/v1/planner/generate') {
    try {
      const body = await readJson(req);
      const plan = generatePlan(body);
      sendJson(res, 200, { plan });
    } catch {
      sendJson(res, 400, { error: 'Invalid planner request' });
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/v1/chat/stream') {
    try {
      const body = await readJson(req);
      await handleChatStream(body, res);
    } catch {
      sendJson(res, 400, { error: 'Invalid chat request' });
    }
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, '127.0.0.1', () => {
  console.info(`[escopenote-gateway] listening on http://127.0.0.1:${PORT}`);
});
