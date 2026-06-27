import type { Editor, Range } from '@tiptap/core';
import { markdownToTiptapBlocks } from '@shared/markdown-to-tiptap';

export function insertAgentResponseIntoNote(
  editor: Editor,
  text: string,
  range?: Range,
): void {
  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }

  const content = markdownToTiptapBlocks(trimmed);

  const chain = editor.chain().focus();
  if (range) {
    chain.deleteRange(range);
  }
  chain.insertContent(content).run();
}
