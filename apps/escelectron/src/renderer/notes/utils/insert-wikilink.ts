import type { Editor, Range } from '@tiptap/core';
import type { LinkPickerItem } from '@renderer/notes/components/link-picker-types';

export function extendWikilinkRange(range: Range): Range {
  return {
    from: Math.max(0, range.from - 1),
    to: range.to,
  };
}

export function insertWikilinkFromPicker(
  editor: Editor,
  range: Range | undefined,
  item: LinkPickerItem,
): void {
  const chain = editor.chain().focus();
  if (range) {
    chain.deleteRange(extendWikilinkRange(range));
  }
  chain
    .insertWikilink({
      targetKind: item.kind,
      targetId: item.id,
      label: item.label,
    })
    .run();
}
