const DEFAULT_CHUNK_SIZE = 600;
const DEFAULT_OVERLAP = 80;

export function chunkText(
  text: string,
  chunkSize = DEFAULT_CHUNK_SIZE,
  overlap = DEFAULT_OVERLAP,
): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) {
    return [];
  }

  const paragraphs = normalized.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let buffer = '';

  const flush = () => {
    const piece = buffer.trim();
    if (piece) {
      chunks.push(piece);
    }
    buffer = '';
  };

  for (const paragraph of paragraphs) {
    if (!buffer) {
      buffer = paragraph;
    } else if (`${buffer}\n\n${paragraph}`.length <= chunkSize) {
      buffer = `${buffer}\n\n${paragraph}`;
    } else {
      flush();
      buffer = paragraph;
    }

    while (buffer.length > chunkSize) {
      chunks.push(buffer.slice(0, chunkSize).trim());
      buffer = buffer.slice(Math.max(0, chunkSize - overlap)).trim();
    }
  }

  flush();

  if (chunks.length === 0 && normalized.length > 0) {
    for (let i = 0; i < normalized.length; i += chunkSize - overlap) {
      chunks.push(normalized.slice(i, i + chunkSize).trim());
    }
  }

  return chunks.filter(Boolean);
}
