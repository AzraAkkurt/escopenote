import { Extension } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

const INDENT_TYPES = ['paragraph', 'heading'] as const;
const MAX_INDENT = 8;

function getBlockIndent(attrs: Record<string, unknown>): number {
  return typeof attrs.indent === 'number' ? attrs.indent : 0;
}

function updateBlockIndent(
  tr: import('@tiptap/pm/state').Transaction,
  pos: number,
  node: import('@tiptap/pm/model').Node,
  delta: number,
): boolean {
  const current = getBlockIndent(node.attrs);
  const next = Math.min(MAX_INDENT, Math.max(0, current + delta));
  if (next === current) {
    return false;
  }
  tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next });
  return true;
}

export const TabIndent = Extension.create({
  name: 'tabIndent',

  addGlobalAttributes() {
    return [
      {
        types: [...INDENT_TYPES],
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const margin = element.style.marginLeft;
              if (!margin) {
                return 0;
              }
              const rem = parseFloat(margin);
              if (Number.isNaN(rem)) {
                return 0;
              }
              return Math.round(rem / 1.5);
            },
            renderHTML: (attributes) => {
              const level = attributes.indent as number;
              if (!level) {
                return {};
              }
              return { style: `margin-left: ${level * 1.5}rem` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection;
          let updated = false;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (!INDENT_TYPES.includes(node.type.name as (typeof INDENT_TYPES)[number])) {
              return;
            }
            if (updateBlockIndent(tr, pos, node, 1)) {
              updated = true;
            }
          });

          if (!updated) {
            const $from = state.selection.$from;
            for (let depth = $from.depth; depth > 0; depth -= 1) {
              const node = $from.node(depth);
              if (!INDENT_TYPES.includes(node.type.name as (typeof INDENT_TYPES)[number])) {
                continue;
              }
              const pos = $from.before(depth);
              if (updateBlockIndent(tr, pos, node, 1)) {
                updated = true;
              }
              break;
            }
          }

          if (updated && dispatch) {
            dispatch(tr);
          }
          return updated;
        },
      outdent:
        () =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection;
          let updated = false;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (!INDENT_TYPES.includes(node.type.name as (typeof INDENT_TYPES)[number])) {
              return;
            }
            if (updateBlockIndent(tr, pos, node, -1)) {
              updated = true;
            }
          });

          if (!updated) {
            const $from = state.selection.$from;
            for (let depth = $from.depth; depth > 0; depth -= 1) {
              const node = $from.node(depth);
              if (!INDENT_TYPES.includes(node.type.name as (typeof INDENT_TYPES)[number])) {
                continue;
              }
              const pos = $from.before(depth);
              if (updateBlockIndent(tr, pos, node, -1)) {
                updated = true;
              }
              break;
            }
          }

          if (updated && dispatch) {
            dispatch(tr);
          }
          return updated;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        if (editor.isActive('table')) {
          return false;
        }
        if (editor.isActive('codeBlock')) {
          return false;
        }
        if (editor.can().sinkListItem('listItem')) {
          return editor.chain().focus().sinkListItem('listItem').run();
        }
        if (editor.can().sinkListItem('taskItem')) {
          return editor.chain().focus().sinkListItem('taskItem').run();
        }
        return editor.commands.indent();
      },
      'Shift-Tab': ({ editor }) => {
        if (editor.isActive('table')) {
          return false;
        }
        if (editor.isActive('codeBlock')) {
          return false;
        }
        if (editor.can().liftListItem('listItem')) {
          return editor.chain().focus().liftListItem('listItem').run();
        }
        if (editor.can().liftListItem('taskItem')) {
          return editor.chain().focus().liftListItem('taskItem').run();
        }
        return editor.commands.outdent();
      },
    };
  },
});
