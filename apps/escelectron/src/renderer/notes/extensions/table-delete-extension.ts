import { Extension, findParentNode } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

function isTableEmpty(table: ProseMirrorNode): boolean {
  let hasText = false;
  table.descendants((node) => {
    if (node.isText && (node.text ?? '').trim().length > 0) {
      hasText = true;
      return false;
    }
    return true;
  });
  return !hasText;
}

function isInEmptyTableCell(editor: import('@tiptap/core').Editor): boolean {
  const { selection } = editor.state;
  if (!selection.empty) {
    return false;
  }

  const tableMatch = findParentNode((node) => node.type.name === 'table')(selection);
  if (!tableMatch || !isTableEmpty(tableMatch.node)) {
    return false;
  }

  const cellMatch = findParentNode((node) =>
    ['tableCell', 'tableHeader'].includes(node.type.name),
  )(selection);
  if (!cellMatch) {
    return false;
  }

  const { $from } = selection;
  return $from.parentOffset === 0;
}

function deleteTableBeforeCursor(editor: import('@tiptap/core').Editor): boolean {
  const { selection } = editor.state;
  if (!selection.empty) {
    return false;
  }

  const { $from } = selection;
  const nodeBefore = $from.nodeBefore;
  if (nodeBefore?.type.name !== 'table' || !isTableEmpty(nodeBefore)) {
    return false;
  }

  const tablePos = $from.pos - nodeBefore.nodeSize;
  return editor
    .chain()
    .focus()
    .deleteRange({ from: tablePos, to: $from.pos })
    .run();
}

function deleteEmptyTable(editor: import('@tiptap/core').Editor): boolean {
  if (deleteTableBeforeCursor(editor)) {
    return true;
  }
  if (!isInEmptyTableCell(editor)) {
    return false;
  }
  return editor.chain().focus().deleteTable().run();
}

export const TableDeleteExtension = Extension.create({
  name: 'tableDelete',
  priority: 1100,

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => deleteEmptyTable(editor),
      Delete: ({ editor }) => deleteEmptyTable(editor),
    };
  },
});
