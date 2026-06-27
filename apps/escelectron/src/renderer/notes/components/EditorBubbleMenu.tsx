import type { Editor } from '@tiptap/core';
import { BubbleMenu } from '@tiptap/react/menus';
import { useTranslation } from 'react-i18next';

interface EditorBubbleMenuProps {
  editor: Editor | null;
}

export function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
  const { t } = useTranslation('notes');

  if (!editor) {
    return null;
  }

  const btn = (label: string, active: boolean, onClick: () => void, child: React.ReactNode) => (
    <button
      key={label}
      type="button"
      className={`editor-bubble__btn${active ? ' editor-bubble__btn--active' : ''}`}
      aria-label={label}
      title={label}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      {child}
    </button>
  );

  return (
    <BubbleMenu
      editor={editor}
      className="editor-bubble"
      shouldShow={({ editor: ed, from, to }) => from !== to && !ed.isActive('codeBlock')}
    >
      {btn(t('toolbar.bold'), editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), (
        <strong>B</strong>
      ))}
      {btn(
        t('toolbar.italic'),
        editor.isActive('italic'),
        () => editor.chain().focus().toggleItalic().run(),
        <em>I</em>,
      )}
      {btn(
        t('toolbar.strike'),
        editor.isActive('strike'),
        () => editor.chain().focus().toggleStrike().run(),
        <s>S</s>,
      )}
      {btn(
        t('toolbar.underline'),
        editor.isActive('underline'),
        () => editor.chain().focus().toggleUnderline().run(),
        <u>U</u>,
      )}
      {btn(
        t('toolbar.code'),
        editor.isActive('code'),
        () => editor.chain().focus().toggleCode().run(),
        '</>',
      )}
      {btn(t('toolbar.link'), editor.isActive('link'), () => {
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
      }, '🔗')}
    </BubbleMenu>
  );
}
