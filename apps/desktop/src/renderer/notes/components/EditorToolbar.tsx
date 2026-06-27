import type { Editor } from '@tiptap/core';
import { useTranslation } from 'react-i18next';

interface ToolbarButtonProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function ToolbarButton({ label, active, disabled, onClick, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className={`editor-toolbar__btn${active ? ' editor-toolbar__btn--active' : ''}`}
      aria-label={label}
      title={label}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="editor-toolbar__divider" aria-hidden />;
}

interface EditorToolbarProps {
  editor: Editor | null;
  onRequestTableInsert?: (editor: Editor) => void;
  onOpenLinkPicker?: (editor: Editor) => void;
  onOpenAskAgent?: (editor: Editor) => void;
}

export function EditorToolbar({
  editor,
  onRequestTableInsert,
  onOpenLinkPicker,
  onOpenAskAgent,
}: EditorToolbarProps) {
  const { t } = useTranslation('notes');

  if (!editor) {
    return null;
  }

  const run = (fn: () => void) => () => fn();

  return (
    <div className="editor-toolbar" role="toolbar" aria-label={t('toolbarAria')}>
      <ToolbarButton
        label={t('toolbar.bold')}
        active={editor.isActive('bold')}
        onClick={run(() => editor.chain().focus().toggleBold().run())}
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        label={t('toolbar.italic')}
        active={editor.isActive('italic')}
        onClick={run(() => editor.chain().focus().toggleItalic().run())}
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        label={t('toolbar.strike')}
        active={editor.isActive('strike')}
        onClick={run(() => editor.chain().focus().toggleStrike().run())}
      >
        <s>S</s>
      </ToolbarButton>
      <ToolbarButton
        label={t('toolbar.underline')}
        active={editor.isActive('underline')}
        onClick={run(() => editor.chain().focus().toggleUnderline().run())}
      >
        <u>U</u>
      </ToolbarButton>
      <ToolbarButton
        label={t('toolbar.highlight')}
        active={editor.isActive('highlight')}
        onClick={run(() => editor.chain().focus().toggleHighlight().run())}
      >
        ◐
      </ToolbarButton>
      <ToolbarButton
        label={t('toolbar.code')}
        active={editor.isActive('code')}
        onClick={run(() => editor.chain().focus().toggleCode().run())}
      >
        {'</>'}
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        label={t('toolbar.alignLeft')}
        active={editor.isActive({ textAlign: 'left' })}
        onClick={run(() => editor.chain().focus().setTextAlign('left').run())}
      >
        <span className="editor-toolbar__align editor-toolbar__align--left" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label={t('toolbar.alignCenter')}
        active={editor.isActive({ textAlign: 'center' })}
        onClick={run(() => editor.chain().focus().setTextAlign('center').run())}
      >
        <span className="editor-toolbar__align editor-toolbar__align--center" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label={t('toolbar.alignRight')}
        active={editor.isActive({ textAlign: 'right' })}
        onClick={run(() => editor.chain().focus().setTextAlign('right').run())}
      >
        <span className="editor-toolbar__align editor-toolbar__align--right" aria-hidden />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        label={t('toolbar.h1')}
        active={editor.isActive('heading', { level: 1 })}
        onClick={run(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        label={t('toolbar.h2')}
        active={editor.isActive('heading', { level: 2 })}
        onClick={run(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        label={t('toolbar.h3')}
        active={editor.isActive('heading', { level: 3 })}
        onClick={run(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}
      >
        H3
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        label={t('toolbar.bulletList')}
        active={editor.isActive('bulletList')}
        onClick={run(() => editor.chain().focus().toggleBulletList().run())}
      >
        •
      </ToolbarButton>
      <ToolbarButton
        label={t('toolbar.orderedList')}
        active={editor.isActive('orderedList')}
        onClick={run(() => editor.chain().focus().toggleOrderedList().run())}
      >
        1.
      </ToolbarButton>
      <ToolbarButton
        label={t('toolbar.taskList')}
        active={editor.isActive('taskList')}
        onClick={run(() => editor.chain().focus().toggleTaskList().run())}
      >
        ☑
      </ToolbarButton>
      <ToolbarButton
        label={t('toolbar.blockquote')}
        active={editor.isActive('blockquote')}
        onClick={run(() => editor.chain().focus().toggleBlockquote().run())}
      >
        ❝
      </ToolbarButton>
      <ToolbarButton
        label={t('toolbar.codeBlock')}
        active={editor.isActive('codeBlock')}
        onClick={run(() => editor.chain().focus().toggleCodeBlock().run())}
      >
        {'{ }'}
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        label={t('toolbar.table')}
        onClick={run(() => onRequestTableInsert?.(editor))}
      >
        ⊞
      </ToolbarButton>
      <ToolbarButton
        label={t('toolbar.divider')}
        onClick={run(() => editor.chain().focus().setHorizontalRule().run())}
      >
        —
      </ToolbarButton>
      <ToolbarButton
        label={t('toolbar.mermaid')}
        active={editor.isActive('codeBlock', { language: 'mermaid' })}
        onClick={run(() =>
          editor
            .chain()
            .focus()
            .setCodeBlock({ language: 'mermaid' })
            .insertContent(
              'flowchart TD\n  A[Başla] --> B{Karar}\n  B -->|Evet| C[Bitir]',
            )
            .run(),
        )}
      >
        ◇
      </ToolbarButton>
      <ToolbarButton
        label={t('toolbar.mathInline')}
        onClick={run(() =>
          editor
            .chain()
            .focus()
            .insertContent({ type: 'inlineMath', attrs: { latex: 'E = mc^2' } })
            .run(),
        )}
      >
        ∑
      </ToolbarButton>
      <ToolbarButton
        label={t('toolbar.askAgent')}
        onClick={run(() => onOpenAskAgent?.(editor))}
      >
        ✦
      </ToolbarButton>
      <ToolbarButton
        label={t('toolbar.wikilink')}
        onClick={run(() => onOpenLinkPicker?.(editor))}
      >
        [[
      </ToolbarButton>
      <ToolbarButton
        label={t('toolbar.link')}
        active={editor.isActive('link')}
        onClick={run(() => {
          const prev = editor.getAttributes('link').href as string | undefined;
          const href = window.prompt(t('toolbar.linkPrompt'), prev ?? 'https://');
          if (href === null) {
            return;
          }
          if (href === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
          }
          editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
        })}
      >
        🔗
      </ToolbarButton>
    </div>
  );
}
