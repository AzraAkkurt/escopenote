import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@renderer/components/ui';
import type { ChatSession } from '@shared/chat-types';

interface SessionListProps {
  sessions: ChatSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export function SessionList({
  sessions,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
}: SessionListProps) {
  const { t } = useTranslation('chat');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');

  const startRename = (session: ChatSession) => {
    setRenamingId(session.id);
    setRenameDraft(session.title);
  };

  const commitRename = (id: string) => {
    onRename(id, renameDraft);
    setRenamingId(null);
  };

  return (
    <aside className="session-list" aria-label={t('sessions')}>
      <Button variant="primary" className="session-list__new" onClick={onNew}>
        {t('newChat')}
      </Button>

      {sessions.length === 0 ? (
        <p className="session-list__empty">{t('noSessions')}</p>
      ) : (
        <ul className="session-list__items">
          {sessions.map((session) => (
            <li key={session.id}>
              {renamingId === session.id ? (
                <input
                  className="session-list__rename"
                  value={renameDraft}
                  autoFocus
                  onChange={(e) => setRenameDraft(e.target.value)}
                  onBlur={() => commitRename(session.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      commitRename(session.id);
                    }
                    if (e.key === 'Escape') {
                      setRenamingId(null);
                    }
                  }}
                />
              ) : (
                <button
                  type="button"
                  className={`session-list__item${activeId === session.id ? ' session-list__item--active' : ''}`}
                  onClick={() => onSelect(session.id)}
                >
                  <span className="session-list__title">
                    {session.title || t('untitled')}
                  </span>
                  <span className="session-list__meta">{session.messages.length}</span>
                </button>
              )}
              <div className="session-list__actions">
                <button
                  type="button"
                  className="session-list__action"
                  aria-label={t('rename')}
                  onClick={() => startRename(session)}
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="session-list__action"
                  aria-label={t('delete')}
                  onClick={() => {
                    if (window.confirm(t('deleteConfirm'))) {
                      onDelete(session.id);
                    }
                  }}
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
