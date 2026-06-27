import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@renderer/components/layout/EmptyState';
import { PageHeader } from '@renderer/components/layout/PageHeader';
import { Button, Spinner, useToast } from '@renderer/components/ui';
import { CourseCard } from '@renderer/courses/components/CourseCard';
import { CreateCourseModal } from '@renderer/courses/components/CreateCourseModal';
import { useCourses } from '@renderer/courses/hooks/useCourses';
import '@renderer/styles/courses.css';

export function LibraryPage() {
  const { t: tp } = useTranslation('pages');
  const { t } = useTranslation('courses');
  const toast = useToast();
  const { courses, loading, error, create } = useCourses();
  const [createOpen, setCreateOpen] = useState(false);

  const handleCreate = async (input: { name: string; icon?: string }) => {
    try {
      await create(input);
      toast.show(t('createSuccess'), 'success');
    } catch (err) {
      toast.show(err instanceof Error ? err.message : t('createError'), 'error');
      throw err;
    }
  };

  return (
    <div className="page page--library">
      <div className="courses-page-header">
        <PageHeader title={tp('library.title')} description={tp('library.description')} />
        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          {t('addCourse')}
        </Button>
      </div>

      {loading ? (
        <div className="courses-loading">
          <Spinner />
        </div>
      ) : error ? (
        <p className="courses-error" role="alert">
          {error}
        </p>
      ) : courses.length === 0 ? (
        <EmptyState
          title={tp('library.emptyTitle')}
          description={tp('library.emptyDescription')}
          action={
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              {t('addCourse')}
            </Button>
          }
        />
      ) : (
        <div className="courses-grid">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}

      <CreateCourseModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
