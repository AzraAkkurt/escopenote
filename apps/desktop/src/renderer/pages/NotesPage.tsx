import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@renderer/components/layout/PageHeader';
import { Button, Input, Spinner, useToast } from '@renderer/components/ui';
import { ipcCall } from '@renderer/lib/ipc';
import { useCourses } from '@renderer/courses/hooks/useCourses';
import { NoteEditor } from '@renderer/notes/components/NoteEditor';
import { NoteBacklinksPanel } from '@renderer/notes/components/NoteBacklinksPanel';
import { NoteSidebar } from '@renderer/notes/components/NoteSidebar';
import { NoteTabs } from '@renderer/notes/components/NoteTabs';
import { NoteTabsProvider, useNoteTabs } from '@renderer/notes/hooks/useNoteTabs';
import { useNotes } from '@renderer/notes/hooks/useNotes';
import type { Note } from '@shared/note-types';
import '@renderer/styles/notes.css';

function NotesPageContent() {
  const { t: tp } = useTranslation('pages');
  const { t } = useTranslation('notes');
  const toast = useToast();
  const navigate = useNavigate();
  const { noteId: routeNoteId } = useParams<{ noteId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { notes, loading, error, refresh } = useNotes();
  const { courses } = useCourses();
  const { openNoteIds, activeNoteId, openTab, closeTab, setActiveTab, pruneTabs } = useNoteTabs();
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [noteLoading, setNoteLoading] = useState(false);
  const loadingNoteIdRef = useRef<string | null>(null);
  const createRequestedRef = useRef(false);
  const lastRouteOpenedRef = useRef<string | null>(null);

  const notesById = useMemo(() => new Map(notes.map((n) => [n.id, n])), [notes]);

  useEffect(() => {
    pruneTabs(new Set(notes.map((n) => n.id)));
  }, [notes, pruneTabs]);

  useEffect(() => {
    if (!routeNoteId || lastRouteOpenedRef.current === routeNoteId) {
      return;
    }
    lastRouteOpenedRef.current = routeNoteId;
    openTab(routeNoteId);
    setActiveTab(routeNoteId);
  }, [routeNoteId, openTab, setActiveTab]);

  useEffect(() => {
    if (!routeNoteId) {
      lastRouteOpenedRef.current = null;
    }
  }, [routeNoteId]);

  const fetchNote = useCallback(
    async (id: string) => {
      if (loadingNoteIdRef.current === id) {
        return;
      }
      if (activeNote?.id === id) {
        return;
      }

      loadingNoteIdRef.current = id;
      setNoteLoading(true);
      try {
        const note = await ipcCall((api) => api.notes.get(id));
        setActiveNote(note);
      } catch (err) {
        toast.show(err instanceof Error ? err.message : t('loadError'), 'error');
      } finally {
        loadingNoteIdRef.current = null;
        setNoteLoading(false);
      }
    },
    [activeNote?.id, t, toast],
  );

  const createNote = useCallback(
    async (courseId?: string | null) => {
      try {
        const note = await ipcCall((api) =>
          api.notes.create({ title: t('untitled'), courseId: courseId ?? null }),
        );
        await refresh();
        openTab(note.id);
        setActiveNote(note);
        navigate(`/notes/${note.id}`, { replace: true });
      } catch (err) {
        toast.show(err instanceof Error ? err.message : t('createError'), 'error');
      }
    },
    [navigate, openTab, refresh, t, toast],
  );

  const deleteNote = useCallback(
    async (id: string) => {
      if (!window.confirm(t('deleteConfirm'))) {
        return;
      }
      try {
        await ipcCall((api) => api.notes.delete(id));
        const remaining = openNoteIds.filter((nid) => nid !== id);
        const wasActive = activeNoteId === id || routeNoteId === id;
        closeTab(id);
        await refresh();
        if (wasActive) {
          const nextId = remaining[remaining.length - 1] ?? null;
          navigate(nextId ? `/notes/${nextId}` : '/notes');
          setActiveNote(null);
        } else if (activeNote?.id === id) {
          setActiveNote(null);
        }
        toast.show(t('deleteSuccess'), 'success');
      } catch (err) {
        toast.show(err instanceof Error ? err.message : t('deleteError'), 'error');
      }
    },
    [activeNote?.id, activeNoteId, closeTab, navigate, openNoteIds, refresh, routeNoteId, t, toast],
  );

  useEffect(() => {
    if (searchParams.get('new') !== '1' || createRequestedRef.current) {
      return;
    }
    createRequestedRef.current = true;
    const courseId = searchParams.get('courseId');
    void createNote(courseId || null);
    const next = new URLSearchParams(searchParams);
    next.delete('new');
    next.delete('courseId');
    setSearchParams(next, { replace: true });
  }, [createNote, searchParams, setSearchParams]);

  useEffect(() => {
    if (routeNoteId) {
      if (openNoteIds.includes(routeNoteId)) {
        void fetchNote(routeNoteId);
      } else {
        setActiveNote(null);
        const next = openNoteIds[openNoteIds.length - 1];
        navigate(next ? `/notes/${next}` : '/notes', { replace: true });
      }
      return;
    }
    if (activeNoteId && openNoteIds.includes(activeNoteId)) {
      const cached = notesById.get(activeNoteId);
      if (cached) {
        setActiveNote((prev) => (prev?.id === cached.id ? prev : cached));
        return;
      }
      void fetchNote(activeNoteId);
      return;
    }
    setActiveNote(null);
  }, [routeNoteId, activeNoteId, openNoteIds, fetchNote, notesById, navigate]);

  const handleTitleChange = async (title: string) => {
    if (!activeNote) {
      return;
    }
    try {
      const updated = await ipcCall((api) => api.notes.update({ id: activeNote.id, title }));
      setActiveNote(updated);
      await refresh();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : t('saveError'), 'error');
    }
  };

  return (
    <div className="page page--notes">
      <PageHeader title={tp('notes.title')} description={tp('notes.description')} />

      {loading ? (
        <div className="notes-loading">
          <Spinner />
        </div>
      ) : error ? (
        <p className="notes-error" role="alert">
          {error}
        </p>
      ) : (
        <div className="notes-layout">
          <NoteSidebar
            notes={notes}
            courses={courses}
            activeNoteId={activeNote?.id ?? routeNoteId ?? null}
            onNewNote={(courseId) => void createNote(courseId)}
            onDeleteNote={(id) => void deleteNote(id)}
          />
          <div className="notes-main">
            <NoteTabs notesById={notesById} />
            {activeNote ? (
              <div className="notes-editor-header">
                <Input
                  className="notes-title-input"
                  value={activeNote.title}
                  onChange={(e) => setActiveNote({ ...activeNote, title: e.target.value })}
                  onBlur={(e) => void handleTitleChange(e.target.value)}
                  aria-label={t('titleLabel')}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="notes-delete-btn"
                  onClick={() => void deleteNote(activeNote.id)}
                >
                  {t('deleteNote')}
                </Button>
              </div>
            ) : null}
            {noteLoading ? (
              <div className="notes-loading">
                <Spinner />
              </div>
            ) : (
              <>
                <NoteEditor
                  note={activeNote}
                  onSaved={(note) => {
                    setActiveNote(note);
                  }}
                />
                <NoteBacklinksPanel noteId={activeNote?.id ?? null} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function NotesPage() {
  return (
    <NoteTabsProvider>
      <NotesPageContent />
    </NoteTabsProvider>
  );
}
