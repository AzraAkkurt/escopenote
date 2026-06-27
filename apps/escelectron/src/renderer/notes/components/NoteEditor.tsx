import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import type { Editor, Range } from '@tiptap/core';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import 'katex/dist/katex.min.css';
import { ipcCall } from '@renderer/lib/ipc';
import { EditorBubbleMenu } from '@renderer/notes/components/EditorBubbleMenu';
import { EditorToolbar } from '@renderer/notes/components/EditorToolbar';
import { LinkPickerModal } from '@renderer/notes/components/LinkPickerModal';
import {
  NoteAskAgentModal,
  type NoteAskAgentContext,
} from '@renderer/notes/components/NoteAskAgentModal';
import {
  TableInsertModal,
  type TableInsertRequest,
} from '@renderer/notes/components/TableInsertModal';
import type { LinkPickerItem } from '@renderer/notes/components/link-picker-types';
import { buildEditorExtensions } from '@renderer/notes/extensions/build-editor-extensions';
import { createSlashCommandExtension } from '@renderer/notes/extensions/slash-command-extension';
import { createSlashCommandRender } from '@renderer/notes/extensions/slash-command-render';
import {
  buildSlashCommands,
  filterSlashCommands,
  type SlashCommandGroup,
} from '@renderer/notes/extensions/slash-commands';
import { createWikilinkSuggestionExtension } from '@renderer/notes/extensions/wikilink-suggestion';
import { createWikilinkSuggestionRender } from '@renderer/notes/extensions/wikilink-suggestion-render';
import { useLinkPickerData } from '@renderer/notes/hooks/useLinkPickerData';
import { useNoteTabs } from '@renderer/notes/hooks/useNoteTabs';
import { createWikilinkClickHandler } from '@renderer/notes/utils/handle-wikilink-click';
import { insertWikilinkFromPicker } from '@renderer/notes/utils/insert-wikilink';
import { tiptapToMarkdown } from '@renderer/notes/utils/tiptapToMarkdown';
import type { Note } from '@shared/note-types';

interface NoteEditorProps {
  note: Note | null;
  onSaved?: (note: Note) => void;
}

type PendingEditorAction = {
  editor: Editor;
  range?: Range;
};

const SAVE_DEBOUNCE_MS = 500;

export function NoteEditor({ note, onSaved }: NoteEditorProps) {
  const { t } = useTranslation('notes');
  const navigate = useNavigate();
  const { openTab } = useNoteTabs();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteIdRef = useRef<string | null>(null);
  const applyingContentRef = useRef(false);
  const onSavedRef = useRef(onSaved);
  const pendingLinkInsertRef = useRef<PendingEditorAction | null>(null);
  const pendingAskAgentRef = useRef<PendingEditorAction | null>(null);
  const editorRef = useRef<Editor | null>(null);
  onSavedRef.current = onSaved;

  const { noteItems, resourceItems, scopedNoteItems, scopedResourceItems } = useLinkPickerData(
    note?.courseId,
  );

  const allPickerItems = useMemo(
    () => [...noteItems, ...resourceItems],
    [noteItems, resourceItems],
  );

  const scopedPickerItems = useMemo(
    () => [...scopedNoteItems, ...scopedResourceItems],
    [scopedNoteItems, scopedResourceItems],
  );

  const pickerPoolRef = useRef(allPickerItems);
  pickerPoolRef.current = note?.courseId ? scopedPickerItems : allPickerItems;

  const [tableInsertRequest, setTableInsertRequest] = useState<TableInsertRequest | null>(null);
  const [linkPickerOpen, setLinkPickerOpen] = useState(false);
  const [askAgentOpen, setAskAgentOpen] = useState(false);
  const [askAgentInsertRange, setAskAgentInsertRange] = useState<Range | undefined>();

  const openLinkPicker = useCallback((ctx: PendingEditorAction) => {
    pendingLinkInsertRef.current = ctx;
    setLinkPickerOpen(true);
  }, []);

  const onRequestTableInsert = useCallback((ctx: TableInsertRequest) => {
    setTableInsertRequest(ctx);
  }, []);

  const openAskAgent = useCallback((ctx: PendingEditorAction) => {
    pendingAskAgentRef.current = ctx;
    setAskAgentInsertRange(ctx.range);
    setAskAgentOpen(true);
  }, []);

  const getNoteMarkdown = useCallback(() => {
    const ed = editorRef.current;
    if (ed) {
      return tiptapToMarkdown(ed.getJSON() as Record<string, unknown>);
    }
    return note?.contentMarkdown ?? '';
  }, [note?.contentMarkdown]);

  const askAgentContext = useMemo((): NoteAskAgentContext | null => {
    if (!note) {
      return null;
    }
    return {
      noteId: note.id,
      noteTitle: note.title,
      courseId: note.courseId,
      getNoteMarkdown,
    };
  }, [note, getNoteMarkdown]);

  const handleLinkPickerSelect = useCallback((item: LinkPickerItem) => {
    const pending = pendingLinkInsertRef.current;
    pendingLinkInsertRef.current = null;
    const ed = pending?.editor ?? editorRef.current;
    if (!ed) {
      return;
    }
    insertWikilinkFromPicker(ed, pending?.range, item);
  }, []);

  const slashLabels = useMemo(
    () => ({
      groups: {
        basic: t('slash.groups.basic'),
        inline: t('slash.groups.inline'),
        lists: t('slash.groups.lists'),
        blocks: t('slash.groups.blocks'),
        advanced: t('slash.groups.advanced'),
      } as Record<SlashCommandGroup, string>,
      items: {
        text: { title: t('slash.text.title'), description: t('slash.text.description') },
        h1: { title: t('slash.h1.title'), description: t('slash.h1.description') },
        h2: { title: t('slash.h2.title'), description: t('slash.h2.description') },
        h3: { title: t('slash.h3.title'), description: t('slash.h3.description') },
        bold: { title: t('slash.bold.title'), description: t('slash.bold.description') },
        italic: { title: t('slash.italic.title'), description: t('slash.italic.description') },
        strike: { title: t('slash.strike.title'), description: t('slash.strike.description') },
        underline: {
          title: t('slash.underline.title'),
          description: t('slash.underline.description'),
        },
        highlight: {
          title: t('slash.highlight.title'),
          description: t('slash.highlight.description'),
        },
        inlineCode: {
          title: t('slash.inlineCode.title'),
          description: t('slash.inlineCode.description'),
        },
        bulletList: {
          title: t('slash.bulletList.title'),
          description: t('slash.bulletList.description'),
        },
        orderedList: {
          title: t('slash.orderedList.title'),
          description: t('slash.orderedList.description'),
        },
        taskList: {
          title: t('slash.taskList.title'),
          description: t('slash.taskList.description'),
        },
        blockquote: {
          title: t('slash.blockquote.title'),
          description: t('slash.blockquote.description'),
        },
        codeBlock: {
          title: t('slash.codeBlock.title'),
          description: t('slash.codeBlock.description'),
        },
        table: { title: t('slash.table.title'), description: t('slash.table.description') },
        divider: { title: t('slash.divider.title'), description: t('slash.divider.description') },
        mathInline: {
          title: t('slash.mathInline.title'),
          description: t('slash.mathInline.description'),
        },
        mathBlock: {
          title: t('slash.mathBlock.title'),
          description: t('slash.mathBlock.description'),
        },
        mermaid: {
          title: t('slash.mermaid.title'),
          description: t('slash.mermaid.description'),
        },
        askAgent: {
          title: t('slash.askAgent.title'),
          description: t('slash.askAgent.description'),
        },
        wikilink: {
          title: t('slash.wikilink.title'),
          description: t('slash.wikilink.description'),
        },
        link: { title: t('slash.link.title'), description: t('slash.link.description') },
      },
    }),
    [t],
  );

  const onOpenLinkPickerRef = useRef(openLinkPicker);
  onOpenLinkPickerRef.current = openLinkPicker;
  const onOpenAskAgentRef = useRef(openAskAgent);
  onOpenAskAgentRef.current = openAskAgent;

  const slashCommands = useMemo(
    () =>
      buildSlashCommands(slashLabels, {
        onRequestTableInsert,
        onOpenLinkPicker: (ctx) => onOpenLinkPickerRef.current(ctx),
        onOpenAskAgent: (ctx) => onOpenAskAgentRef.current(ctx),
      }),
    [slashLabels, onRequestTableInsert],
  );

  const wikilinkClickHandler = useMemo(
    () =>
      createWikilinkClickHandler(navigate, (noteId) => {
        openTab(noteId);
      }),
    [navigate, openTab],
  );

  const extensions = useMemo(() => {
    const slashExtension = createSlashCommandExtension({
      items: ({ query }) => filterSlashCommands(slashCommands, query),
      command: ({ editor, range, props }) => {
        props.command({ editor, range });
      },
      render: createSlashCommandRender(slashLabels.groups),
    });

    const wikilinkSuggestionExtension = createWikilinkSuggestionExtension({
      items: ({ query }) => {
        const q = query.trim().toLowerCase();
        const pool = pickerPoolRef.current;
        if (!q) {
          return pool.slice(0, 12);
        }
        return pool
          .filter(
            (item) =>
              item.label.toLowerCase().includes(q) ||
              item.subtitle?.toLowerCase().includes(q),
          )
          .slice(0, 12);
      },
      command: ({ editor, range, item }) => {
        insertWikilinkFromPicker(editor, range, item);
      },
      onBrowseAll: ({ editor, range }) => {
        onOpenLinkPickerRef.current({ editor, range });
      },
      render: createWikilinkSuggestionRender(),
    });

    return buildEditorExtensions({
      placeholder: t('editorPlaceholder'),
      slashExtension,
      wikilinkSuggestionExtension,
      wikilink: {
        onClick: wikilinkClickHandler,
      },
    });
  }, [slashCommands, slashLabels.groups, t, wikilinkClickHandler]);

  const scheduleSave = useCallback(
    (noteId: string, contentJson: Record<string, unknown>, contentMarkdown: string) => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
      saveTimer.current = setTimeout(() => {
        void ipcCall((api) =>
          api.notes.update({ id: noteId, contentJson, contentMarkdown }),
        ).then((updated) => onSavedRef.current?.(updated));
      }, SAVE_DEBOUNCE_MS);
    },
    [],
  );

  const editor = useEditor({
    extensions,
    content: note?.contentJson ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    onUpdate: ({ editor: ed }) => {
      if (applyingContentRef.current) {
        return;
      }
      const id = noteIdRef.current;
      if (!id) {
        return;
      }
      const json = ed.getJSON() as Record<string, unknown>;
      const markdown = tiptapToMarkdown(json);
      scheduleSave(id, json, markdown);
    },
    editorProps: {
      attributes: {
        class: 'note-editor__content',
      },
    },
  });

  editorRef.current = editor;

  useEffect(() => {
    noteIdRef.current = note?.id ?? null;
    if (!editor || !note) {
      return;
    }
    const current = JSON.stringify(editor.getJSON());
    const incoming = JSON.stringify(note.contentJson);
    if (current !== incoming) {
      applyingContentRef.current = true;
      editor.commands.setContent(note.contentJson, { emitUpdate: false });
      applyingContentRef.current = false;
    }
  }, [editor, note?.id, note?.contentJson]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, []);

  if (!note) {
    return (
      <div className="note-editor note-editor--empty">
        <p>{t('selectNote')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="note-editor">
        <EditorToolbar
          editor={editor}
          onRequestTableInsert={(ed) => onRequestTableInsert({ editor: ed })}
          onOpenLinkPicker={(ed) => openLinkPicker({ editor: ed })}
          onOpenAskAgent={(ed) => openAskAgent({ editor: ed })}
        />
        <EditorBubbleMenu editor={editor} />
        <div className="note-editor__body">
          <EditorContent editor={editor} />
        </div>
      </div>
      <TableInsertModal
        request={tableInsertRequest}
        onClose={() => setTableInsertRequest(null)}
      />
      <LinkPickerModal
        open={linkPickerOpen}
        courseId={note.courseId}
        onClose={() => {
          setLinkPickerOpen(false);
          pendingLinkInsertRef.current = null;
        }}
        onSelect={handleLinkPickerSelect}
      />
      <NoteAskAgentModal
        open={askAgentOpen}
        context={askAgentContext}
        editor={editor}
        insertRange={askAgentInsertRange}
        onClose={() => {
          setAskAgentOpen(false);
          setAskAgentInsertRange(undefined);
          pendingAskAgentRef.current = null;
        }}
      />
    </>
  );
}
