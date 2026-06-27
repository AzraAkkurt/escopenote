import { Extension } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion';

export const slashCommandPluginKey = new PluginKey('slashCommandSuggestion');

export function createSlashCommandExtension(
  suggestion: Omit<SuggestionOptions, 'editor'>,
): Extension {
  return Extension.create({
    name: 'slashCommand',

    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          pluginKey: slashCommandPluginKey,
          char: '/',
          allowSpaces: false,
          startOfLine: false,
          ...suggestion,
        }),
      ];
    },
  });
}
