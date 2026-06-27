import type { Editor, Range } from '@tiptap/core';
import { MERMAID_TEMPLATE } from '@renderer/notes/components/MermaidCodeBlockView';
import { applyPlainTextBlock } from '@renderer/notes/utils/clear-block-formatting';

export type SlashCommandGroup = 'basic' | 'inline' | 'lists' | 'blocks' | 'advanced';

export interface SlashCommandItem {
  id: string;
  group: SlashCommandGroup;
  title: string;
  description: string;
  icon: string;
  keywords: string[];
  command: (ctx: { editor: Editor; range: Range }) => void;
}

export interface SlashCommandLabels {
  groups: Record<SlashCommandGroup, string>;
  items: Record<string, { title: string; description: string }>;
}

export interface SlashCommandBuildOptions {
  onRequestTableInsert?: (ctx: { editor: Editor; range: Range }) => void;
  onOpenLinkPicker?: (ctx: { editor: Editor; range: Range }) => void;
  onOpenAskAgent?: (ctx: { editor: Editor; range?: Range }) => void;
}

export function buildSlashCommands(
  labels: SlashCommandLabels,
  options?: SlashCommandBuildOptions,
): SlashCommandItem[] {
  const t = (id: string) => labels.items[id] ?? { title: id, description: '' };

  const commands: SlashCommandItem[] = [
    {
      id: 'text',
      group: 'basic',
      icon: '¶',
      ...t('text'),
      keywords: ['text', 'paragraph', 'paragraf', 'metin'],
      command: ({ editor, range }) => {
        applyPlainTextBlock(editor, range);
      },
    },
    {
      id: 'h1',
      group: 'basic',
      icon: 'H1',
      ...t('h1'),
      keywords: ['h1', 'heading', 'baslik', 'title'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
      },
    },
    {
      id: 'h2',
      group: 'basic',
      icon: 'H2',
      ...t('h2'),
      keywords: ['h2', 'heading', 'baslik', 'subtitle'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
      },
    },
    {
      id: 'h3',
      group: 'basic',
      icon: 'H3',
      ...t('h3'),
      keywords: ['h3', 'heading', 'baslik'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
      },
    },
    {
      id: 'bold',
      group: 'inline',
      icon: 'B',
      ...t('bold'),
      keywords: ['bold', 'kalin', 'strong'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBold().run();
      },
    },
    {
      id: 'italic',
      group: 'inline',
      icon: 'I',
      ...t('italic'),
      keywords: ['italic', 'italik', 'emphasis'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleItalic().run();
      },
    },
    {
      id: 'strike',
      group: 'inline',
      icon: 'S',
      ...t('strike'),
      keywords: ['strike', 'strikethrough', 'ustu cizili'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleStrike().run();
      },
    },
    {
      id: 'underline',
      group: 'inline',
      icon: 'U',
      ...t('underline'),
      keywords: ['underline', 'alti cizili'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleUnderline().run();
      },
    },
    {
      id: 'highlight',
      group: 'inline',
      icon: '◐',
      ...t('highlight'),
      keywords: ['highlight', 'vurgu', 'mark'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleHighlight().run();
      },
    },
    {
      id: 'inlineCode',
      group: 'inline',
      icon: '</>',
      ...t('inlineCode'),
      keywords: ['code', 'inline', 'kod'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleCode().run();
      },
    },
    {
      id: 'bulletList',
      group: 'lists',
      icon: '•',
      ...t('bulletList'),
      keywords: ['bullet', 'list', 'liste', 'unordered'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      id: 'orderedList',
      group: 'lists',
      icon: '1.',
      ...t('orderedList'),
      keywords: ['ordered', 'numbered', 'numarali', 'liste'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      id: 'taskList',
      group: 'lists',
      icon: '☑',
      ...t('taskList'),
      keywords: ['task', 'todo', 'checkbox', 'gorev', 'yapilacak'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run();
      },
    },
    {
      id: 'blockquote',
      group: 'blocks',
      icon: '❝',
      ...t('blockquote'),
      keywords: ['quote', 'blockquote', 'alinti'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      },
    },
    {
      id: 'codeBlock',
      group: 'blocks',
      icon: '{ }',
      ...t('codeBlock'),
      keywords: ['code', 'block', 'kod', 'pre'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      },
    },
    {
      id: 'table',
      group: 'blocks',
      icon: '⊞',
      ...t('table'),
      keywords: ['table', 'tablo', 'grid'],
      command: ({ editor, range }) => {
        if (options?.onRequestTableInsert) {
          options.onRequestTableInsert({ editor, range });
          return;
        }
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run();
      },
    },
    {
      id: 'divider',
      group: 'blocks',
      icon: '—',
      ...t('divider'),
      keywords: ['divider', 'hr', 'line', 'ayirici', 'cizgi'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      },
    },
    {
      id: 'mathInline',
      group: 'advanced',
      icon: '∑',
      ...t('mathInline'),
      keywords: ['math', 'formula', 'latex', 'formul', 'inline'],
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: 'inlineMath',
            attrs: { latex: 'E = mc^2' },
          })
          .run();
      },
    },
    {
      id: 'mathBlock',
      group: 'advanced',
      icon: '∫',
      ...t('mathBlock'),
      keywords: ['math', 'formula', 'latex', 'formul', 'block', 'equation'],
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: 'blockMath',
            attrs: { latex: '\\int_a^b f(x)\\,dx' },
          })
          .run();
      },
    },
    {
      id: 'mermaid',
      group: 'blocks',
      icon: '◇',
      ...t('mermaid'),
      keywords: ['mermaid', 'flowchart', 'diagram', 'akış', 'sema', 'chart'],
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setCodeBlock({ language: 'mermaid' })
          .insertContent(MERMAID_TEMPLATE)
          .run();
      },
    },
    {
      id: 'askAgent',
      group: 'advanced',
      icon: '✦',
      ...t('askAgent'),
      keywords: ['agent', 'ai', 'ask', 'sor', 'agenta', 'yardim', 'help', 'chat'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        if (options?.onOpenAskAgent) {
          options.onOpenAskAgent({ editor });
        }
      },
    },
    {
      id: 'wikilink',
      group: 'advanced',
      icon: '[[',
      ...t('wikilink'),
      keywords: ['wikilink', 'link', 'note', 'baglanti', 'not'],
      command: ({ editor, range }) => {
        if (options?.onOpenLinkPicker) {
          options.onOpenLinkPicker({ editor, range });
        }
      },
    },
    {
      id: 'link',
      group: 'advanced',
      icon: '🔗',
      ...t('link'),
      keywords: ['link', 'url', 'hyperlink', 'baglanti'],
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: 'text',
            text: 'bağlantı metni',
            marks: [{ type: 'link', attrs: { href: 'https://' } }],
          })
          .run();
      },
    },
  ];

  return commands.map((item) => ({
    ...item,
    keywords: [
      item.id,
      item.title.toLowerCase(),
      item.description.toLowerCase(),
      ...item.keywords,
    ],
  }));
}

export function filterSlashCommands(items: SlashCommandItem[], query: string): SlashCommandItem[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return items;
  }
  return items.filter((item) => item.keywords.some((kw) => kw.includes(q)));
}

export const SLASH_GROUP_ORDER: SlashCommandGroup[] = [
  'basic',
  'inline',
  'lists',
  'blocks',
  'advanced',
];
