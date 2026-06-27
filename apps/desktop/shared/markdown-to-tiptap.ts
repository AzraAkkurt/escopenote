/**
 * Converts assistant/chat markdown into TipTap-compatible JSON (StarterKit subset).
 */

type TipTapMark = { type: string; attrs?: Record<string, unknown> };
type TipTapNode = {
  type: string;
  text?: string;
  content?: TipTapNode[];
  attrs?: Record<string, unknown>;
  marks?: TipTapMark[];
};

const LIST_LINE = /^\s*(?:[-*+]|\d+\.)\s+/;
const HEADING_LINE = /^(#{1,3})\s+(.+)$/;

function parseInline(text: string): TipTapNode[] {
  const nodes: TipTapNode[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;

  for (const match of text.matchAll(re)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      nodes.push({ type: 'text', text: text.slice(lastIndex, index) });
    }
    const raw = match[0];
    if (raw.startsWith('**')) {
      nodes.push({
        type: 'text',
        text: raw.slice(2, -2),
        marks: [{ type: 'bold' }],
      });
    } else if (raw.startsWith('`')) {
      nodes.push({
        type: 'text',
        text: raw.slice(1, -1),
        marks: [{ type: 'code' }],
      });
    } else {
      nodes.push({
        type: 'text',
        text: raw.slice(1, -1),
        marks: [{ type: 'italic' }],
      });
    }
    lastIndex = index + raw.length;
  }

  if (lastIndex < text.length) {
    nodes.push({ type: 'text', text: text.slice(lastIndex) });
  }

  if (nodes.length === 0) {
    nodes.push({ type: 'text', text: '' });
  }

  return nodes;
}

function paragraphFromLine(line: string): TipTapNode {
  const heading = line.match(HEADING_LINE);
  if (heading) {
    return {
      type: 'heading',
      attrs: { level: heading[1].length },
      content: parseInline(heading[2].trim()),
    };
  }
  return {
    type: 'paragraph',
    content: parseInline(line.trim()),
  };
}

function stripListMarker(line: string): string {
  return line.replace(/^\s*(?:[-*+]|\d+\.)\s+/, '').trim();
}

function isOrderedListLine(line: string): boolean {
  return /^\s*\d+\.\s+/.test(line);
}

function blockFromLines(lines: string[]): TipTapNode[] {
  if (lines.length === 0) {
    return [];
  }

  if (lines.every((line) => LIST_LINE.test(line))) {
    const ordered = lines.every(isOrderedListLine);
    const listType = ordered ? 'orderedList' : 'bulletList';
    return [
      {
        type: listType,
        content: lines.map((line) => ({
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: parseInline(stripListMarker(line)),
            },
          ],
        })),
      },
    ];
  }

  return lines.map((line) => paragraphFromLine(line));
}

function splitIntoBlocks(markdown: string): string[][] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: string[][] = [];
  let current: string[] = [];

  const flush = () => {
    if (current.length > 0) {
      blocks.push(current);
      current = [];
    }
  };

  for (const line of lines) {
    if (!line.trim()) {
      flush();
      continue;
    }

    const lineIsList = LIST_LINE.test(line);
    const blockIsList = current.length > 0 && current.every((l) => LIST_LINE.test(l));

    if (current.length > 0 && lineIsList !== blockIsList) {
      flush();
    }

    current.push(line);
  }

  flush();
  return blocks;
}

/** TipTap `doc` root for notes.create / notes.update */
export function markdownToTiptapDoc(markdown: string): Record<string, unknown> {
  const trimmed = markdown.trim();
  if (!trimmed) {
    return {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    };
  }

  const content = splitIntoBlocks(trimmed).flatMap((block) => blockFromLines(block));

  return {
    type: 'doc',
    content: content.length > 0 ? content : [{ type: 'paragraph' }],
  };
}

/** Block nodes for editor.insertContent (no doc wrapper) */
export function markdownToTiptapBlocks(markdown: string): TipTapNode[] {
  const doc = markdownToTiptapDoc(markdown) as TipTapNode;
  return doc.content ?? [{ type: 'paragraph' }];
}
