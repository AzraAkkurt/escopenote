import { Mark, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { LinkTargetKind } from '@shared/link-types';
import { formatWikilink } from '@shared/link-types';

export interface WikilinkClickPayload {
  targetKind: LinkTargetKind;
  targetId: string;
  label: string;
}

export interface WikilinkOptions {
  onClick?: (payload: WikilinkClickPayload) => void;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    wikilink: {
      insertWikilink: (attrs: {
        targetKind: LinkTargetKind;
        targetId: string;
        label: string;
      }) => ReturnType;
    };
  }
}

export const Wikilink = Mark.create<WikilinkOptions>({
  name: 'wikilink',

  priority: 1000,

  inclusive: false,

  addOptions() {
    return {
      onClick: undefined,
    };
  },

  addAttributes() {
    return {
      targetKind: {
        default: 'note',
        parseHTML: (el) => el.getAttribute('data-target-kind') ?? 'note',
        renderHTML: (attrs) => ({ 'data-target-kind': attrs.targetKind }),
      },
      targetId: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-target-id'),
        renderHTML: (attrs) =>
          attrs.targetId ? { 'data-target-id': attrs.targetId } : {},
      },
      label: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-label') ?? el.textContent ?? '',
        renderHTML: (attrs) => ({ 'data-label': attrs.label }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-wikilink]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-wikilink': '',
        class: 'wikilink',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      insertWikilink:
        (attrs) =>
        ({ chain }) =>
          chain()
            .insertContent({
              type: 'text',
              text: attrs.label,
              marks: [
                {
                  type: this.name,
                  attrs: {
                    targetKind: attrs.targetKind,
                    targetId: attrs.targetId,
                    label: attrs.label,
                  },
                },
              ],
            })
            .run(),
    };
  },

  addProseMirrorPlugins() {
    const onClick = this.options.onClick;
    if (!onClick) {
      return [];
    }

    return [
      new Plugin({
        key: new PluginKey('wikilinkClick'),
        props: {
          handleClick: (view, pos, event) => {
            const { schema } = view.state;
            const wikilinkType = schema.marks.wikilink;
            if (!wikilinkType) {
              return false;
            }

            const $pos = view.state.doc.resolve(pos);
            const mark = wikilinkType.isInSet($pos.marks());
            if (!mark || !mark.attrs.targetId) {
              return false;
            }

            event.preventDefault();
            onClick({
              targetKind: mark.attrs.targetKind as LinkTargetKind,
              targetId: String(mark.attrs.targetId),
              label: String(mark.attrs.label ?? ''),
            });
            return true;
          },
        },
      }),
    ];
  },
});

export { formatWikilink };
