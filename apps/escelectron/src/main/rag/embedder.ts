import { randomUUID } from 'node:crypto';
import { tokenize } from './tokenize';

export function buildTermVector(tokens: string[]): Record<string, number> {
  const vector: Record<string, number> = {};
  for (const token of tokens) {
    vector[token] = (vector[token] ?? 0) + 1;
  }
  return vector;
}

export function embedText(text: string): Record<string, number> {
  return buildTermVector(tokenize(text));
}

export function cosineSimilarity(
  a: Record<string, number>,
  b: Record<string, number>,
): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const value of Object.values(a)) {
    normA += value * value;
  }
  for (const value of Object.values(b)) {
    normB += value * value;
  }

  for (const [term, weightA] of Object.entries(a)) {
    const weightB = b[term];
    if (weightB) {
      dot += weightA * weightB;
    }
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function createChunkId(): string {
  return `chk_${randomUUID()}`;
}
