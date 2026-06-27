import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ipcCall } from '@renderer/lib/ipc';
import { useNoteTabs } from '@renderer/notes/hooks/useNoteTabs';
import type { Note } from '@shared/note-types';

interface NoteBacklinksPanelProps {
  noteId: string | null;
}

export function NoteBacklinksPanel({ noteId }: NoteBacklinksPanelProps) {
  const { t } = useTranslation('notes');
  const navigate = useNavigate();
  const { openTab } = useNoteTabs();
  const [backlinks, setBacklinks] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!noteId) {
      setBacklinks([]);
      return;
    }
    setLoading(true);
    void ipcCall((api) => api.notes.backlinks(noteId))
      .then(setBacklinks)
      .finally(() => setLoading(false));
  }, [noteId]);

  if (!noteId) {
    return null;
  }

  return (
    <aside className="note-backlinks" aria-label={t('backlinks.aria')}>
      <h3 className="note-backlinks__title">{t('backlinks.title')}</h3>
      {loading ? (
        <p className="note-backlinks__muted">{t('backlinks.loading')}</p>
      ) : backlinks.length === 0 ? (
        <p className="note-backlinks__muted">{t('backlinks.empty')}</p>
      ) : (
        <ul className="note-backlinks__list">
          {backlinks.map((note) => (
            <li key={note.id}>
              <button
                type="button"
                className="note-backlinks__link"
                onClick={() => {
                  openTab(note.id);
                  navigate(`/notes/${note.id}`);
                }}
              >
                {note.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
