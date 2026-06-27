import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@renderer/components/ui';
import type { Course } from '@shared/course-types';
import type { Note } from '@shared/note-types';

interface NoteSidebarProps {
  notes: Note[];
  courses: Course[];
  activeNoteId: string | null;
  onNewNote: (courseId?: string | null) => void;
  onDeleteNote: (noteId: string) => void;
}

export function NoteSidebar({
  notes,
  courses,
  activeNoteId,
  onNewNote,
  onDeleteNote,
}: NoteSidebarProps) {
  const { t } = useTranslation('notes');

  const standalone = useMemo(() => notes.filter((n) => n.courseId === null), [notes]);

  const byCourse = useMemo(() => {
    const map = new Map<string, Note[]>();
    for (const course of courses) {
      map.set(
        course.id,
        notes.filter((n) => n.courseId === course.id),
      );
    }
    return map;
  }, [courses, notes]);

  const renderNoteRow = (note: Note) => (
    <li key={note.id} className="note-sidebar__row">
      <Link
        to={`/notes/${note.id}`}
        className={`note-sidebar__link${activeNoteId === note.id ? ' note-sidebar__link--active' : ''}`}
      >
        {note.title}
      </Link>
      <Button
        variant="ghost"
        size="sm"
        className="note-sidebar__delete"
        aria-label={t('deleteNoteAria', { title: note.title })}
        onClick={() => onDeleteNote(note.id)}
      >
        ×
      </Button>
    </li>
  );

  return (
    <aside className="note-sidebar" aria-label={t('sidebarAria')}>
      <div className="note-sidebar__header">
        <h2 className="note-sidebar__title">{t('sidebarTitle')}</h2>
        <Button variant="primary" size="sm" onClick={() => onNewNote(null)}>
          {t('newNote')}
        </Button>
      </div>

      <section className="note-sidebar__group">
        <h3 className="note-sidebar__group-title">{t('standaloneNotes')}</h3>
        {standalone.length === 0 ? (
          <p className="note-sidebar__empty">{t('noStandalone')}</p>
        ) : (
          <ul className="note-sidebar__list">{standalone.map(renderNoteRow)}</ul>
        )}
      </section>

      {courses.map((course) => {
        const courseNotes = byCourse.get(course.id) ?? [];
        return (
          <section key={course.id} className="note-sidebar__group">
            <div className="note-sidebar__group-header">
              <h3 className="note-sidebar__group-title">
                <span aria-hidden>{course.icon ?? '📘'}</span> {course.name}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => onNewNote(course.id)}>
                +
              </Button>
            </div>
            {courseNotes.length === 0 ? (
              <p className="note-sidebar__empty">{t('noCourseNotes')}</p>
            ) : (
              <ul className="note-sidebar__list">{courseNotes.map(renderNoteRow)}</ul>
            )}
          </section>
        );
      })}
    </aside>
  );
}
