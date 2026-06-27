import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { EmptyState } from '@renderer/components/layout/EmptyState';
import { PageHeader } from '@renderer/components/layout/PageHeader';
import { Button, Card } from '@renderer/components/ui';
import { useCourses } from '@renderer/courses/hooks/useCourses';
import { useNotes } from '@renderer/notes/hooks/useNotes';
import '@renderer/styles/overview.css';

export function OverviewPage() {
  const { t } = useTranslation('pages');
  const { courses, loading: coursesLoading } = useCourses();
  const { notes, loading: notesLoading } = useNotes();

  const recentCourses = [...courses]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 4);
  const recentNotes = [...notes]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  const loading = coursesLoading || notesLoading;

  return (
    <div className="page page--overview">
      <PageHeader title={t('overview.title')} description={t('overview.description')} />

      <div className="overview-actions">
        <Link to="/library">
          <Button variant="primary">{t('overview.addCourse')}</Button>
        </Link>
        <Link to="/notes?new=1">
          <Button variant="secondary">{t('overview.newNote')}</Button>
        </Link>
        <Link to="/chat">
          <Button variant="ghost">{t('overview.openChat')}</Button>
        </Link>
      </div>

      {loading ? (
        <p>{t('overview.loading')}</p>
      ) : recentCourses.length === 0 && recentNotes.length === 0 ? (
        <EmptyState
          title={t('overview.emptyTitle')}
          description={t('overview.emptyDescription')}
          action={
            <Link to="/library">
              <Button variant="primary">{t('overview.addCourse')}</Button>
            </Link>
          }
        />
      ) : (
        <div className="overview-grid">
          <section className="overview-section">
            <h2 className="overview-section__title">{t('overview.recentCourses')}</h2>
            {recentCourses.length === 0 ? (
              <p className="overview-section__empty">{t('overview.noCourses')}</p>
            ) : (
              <div className="overview-course-list">
                {recentCourses.map((course) => (
                  <Link key={course.id} to={`/library/${course.id}`} className="overview-course-card">
                    <Card>
                      <span className="overview-course-card__icon">{course.icon ?? '📘'}</span>
                      <strong>{course.name}</strong>
                      <span className="overview-course-card__meta">
                        {t('overview.resourceCount', { count: course.resourceIds.length })}
                      </span>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="overview-section">
            <h2 className="overview-section__title">{t('overview.recentNotes')}</h2>
            {recentNotes.length === 0 ? (
              <p className="overview-section__empty">{t('overview.noNotes')}</p>
            ) : (
              <ul className="overview-note-list">
                {recentNotes.map((note) => (
                  <li key={note.id}>
                    <Link to={`/notes/${note.id}`}>{note.title}</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
