import { Extension } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion';

export const wikilinkSuggestionPluginKey = new PluginKey('wikilinkSuggestion');
import {
  LINK_PICKER_BROWSE_ID,
  type WikilinkSuggestionItem,
} from '@renderer/notes/components/link-picker-types';

export function createWikilinkSuggestionExtension(
  options: {
    items: (props: { query: string }) => WikilinkSuggestionItem[];
    command: (props: { editor: import('@tiptap/core').Editor; range: import('@tiptap/core').Range; item: WikilinkSuggestionItem }) => void;
    onBrowseAll: (props: { editor: import('@tiptap/core').Editor; range: import('@tiptap/core').Range }) => void;
    render: NonNullable<SuggestionOptions<WikilinkSuggestionItem>['render']>;
  },
): Extension {
  return Extension.create({
    name: 'wikilinkSuggestion',

    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          pluginKey: wikilinkSuggestionPluginKey,
          char: '[',
          allowSpaces: true,
          allowedPrefixes: null,
          startOfLine: false,
          allow: ({ state, range }) => {
            const textBefore = state.doc.textBetween(Math.max(0, range.from - 1), range.from);
            return textBefore === '[';
          },
          items: ({ query }) => {
            const q = query.startsWith('[') ? query.slice(1) : query;
            const items = options.items({ query: q });
            if (items.length === 0 && !q.trim()) {
              return [
                {
                  kind: 'note',
                  id: LINK_PICKER_BROWSE_ID,
                  label: '',
                  isBrowseAll: true,
                } as WikilinkSuggestionItem,
              ];
            }
            return [
              ...items.slice(0, 12),
              {
                kind: 'note',
                id: LINK_PICKER_BROWSE_ID,
                label: '',
                isBrowseAll: true,
              } as WikilinkSuggestionItem,
            ];
          },
          command: ({ editor, range, props }) => {
            if (props.isBrowseAll || props.id === LINK_PICKER_BROWSE_ID) {
              options.onBrowseAll({ editor, range });
              return;
            }
            options.command({ editor, range, item: props });
          },
          render: options.render,
        }),
      ];
    },
  });
}
