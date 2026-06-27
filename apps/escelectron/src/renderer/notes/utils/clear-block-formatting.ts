import type { Editor, Range } from '@tiptap/core';

/** Slash "/metin" — block'u düz paragrafa çevirir; başlık ve satır içi biçimleri kaldırır. */
export function applyPlainTextBlock(editor: Editor, range: Range): void {
  editor.chain().focus().deleteRange(range).run();

  const { $from } = editor.state.selection;
  const blockRange = $from.blockRange();
  if (!blockRange) {
    editor.chain().focus().setParagraph().run();
    return;
  }

  const { start, end } = blockRange;

  editor
    .chain()
    .focus()
    .setTextSelection({ from: start, to: end })
    .unsetAllMarks()
    .setParagraph()
    .unsetTextAlign()
    .updateAttributes('paragraph', { indent: 0 })
    .setTextSelection(Math.min(start + 1, editor.state.doc.content.size))
    .run();
}
