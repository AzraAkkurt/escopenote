import type { Editor, Range } from '@tiptap/core';

export interface InsertTableOptions {
  rows: number;
  cols: number;
  withHeaderRow?: boolean;
}

export function insertTableAt(
  editor: Editor,
  options: InsertTableOptions,
  range?: Range,
): void {
  const chain = editor.chain().focus();
  if (range) {
    chain.deleteRange(range);
  }
  chain
    .insertTable({
      rows: options.rows,
      cols: options.cols,
      withHeaderRow: options.withHeaderRow ?? true,
    })
    .run();
}
