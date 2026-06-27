import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@renderer/components/ui';
import { useNoteTabs } from '@renderer/notes/hooks/useNoteTabs';
import type { Note } from '@shared/note-types';

interface NoteTabsProps {
  notesById: Map<string, Note>;
}

export function NoteTabs({ notesById }: NoteTabsProps) {
  const { t } = useTranslation('notes');
  const navigate = useNavigate();
  const { openNoteIds, activeNoteId, closeTab, setActiveTab } = useNoteTabs();

  if (openNoteIds.length === 0) {
    return null;
  }

  return (
    <div className="note-tabs" role="tablist" aria-label={t('tabsAria')}>
      {openNoteIds.map((id) => {
        const note = notesById.get(id);
        const label = note?.title ?? t('untitled');
        const isActive = id === activeNoteId;
        return (
          <div
            key={id}
            className={`note-tabs__tab${isActive ? ' note-tabs__tab--active' : ''}`}
          >
            <button
              type="button"
              role="tab"
              aria-selected={isActive}
              className="note-tabs__label"
              onClick={() => {
                setActiveTab(id);
                navigate(`/notes/${id}`);
              }}
            >
              {label}
            </button>
            <Button
              variant="ghost"
              size="sm"
              className="note-tabs__close"
              aria-label={t('closeTab', { title: label })}
              onClick={(e) => {
                e.stopPropagation();
                const remaining = openNoteIds.filter((nid) => nid !== id);
                const nextActive = isActive
                  ? (remaining[remaining.length - 1] ?? null)
                  : activeNoteId;
                closeTab(id);
                if (isActive) {
                  navigate(nextActive ? `/notes/${nextActive}` : '/notes');
                }
              }}
            >
              ×
            </Button>
          </div>
        );
      })}
    </div>
  );
}
