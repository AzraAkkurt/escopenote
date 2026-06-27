import StarterKit from '@tiptap/starter-kit';
import { MermaidCodeBlock } from '@renderer/notes/extensions/mermaid-code-block';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Mathematics from '@tiptap/extension-mathematics';
import type { Extensions } from '@tiptap/core';
import type { Extension } from '@tiptap/core';
import { TabIndent } from '@renderer/notes/extensions/tab-indent-extension';
import { TableDeleteExtension } from '@renderer/notes/extensions/table-delete-extension';
import { Wikilink, type WikilinkOptions } from '@renderer/notes/extensions/wikilink-extension';

export interface BuildEditorExtensionsOptions {
  placeholder: string;
  slashExtension: Extension;
  wikilinkSuggestionExtension?: Extension;
  wikilink?: WikilinkOptions;
}

export function buildEditorExtensions(
  placeholderOrOptions: string | BuildEditorExtensionsOptions,
  slashExtensionLegacy?: Extension,
): Extensions {
  const options: BuildEditorExtensionsOptions =
    typeof placeholderOrOptions === 'string'
      ? { placeholder: placeholderOrOptions, slashExtension: slashExtensionLegacy! }
      : placeholderOrOptions;
  const { placeholder, slashExtension, wikilinkSuggestionExtension, wikilink } = options;
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      codeBlock: false,
    }),
    MermaidCodeBlock.configure({
      enableTabIndentation: true,
      tabSize: 2,
    }),
    Underline,
    Highlight.configure({ multicolor: false }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right'],
      defaultAlignment: 'left',
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
    }),
    Wikilink.configure(wikilink ?? {}),
    TaskList,
    TaskItem.configure({ nested: true }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    TableDeleteExtension,
    Mathematics.configure({
      katexOptions: {
        throwOnError: false,
        strict: 'ignore',
      },
    }),
    TabIndent,
    Placeholder.configure({ placeholder }),
    slashExtension,
    ...(wikilinkSuggestionExtension ? [wikilinkSuggestionExtension] : []),
  ];
}
