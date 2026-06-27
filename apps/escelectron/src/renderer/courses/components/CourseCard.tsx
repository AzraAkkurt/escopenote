import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card } from '@renderer/components/ui';
import type { Course } from '@shared/course-types';

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  const { t } = useTranslation('courses');

  return (
    <Link to={`/library/${course.id}`} className="course-card">
      <Card>
        <span className="course-card__icon" aria-hidden>
          {course.icon ?? '📘'}
        </span>
        <strong className="course-card__name">{course.name}</strong>
        <span className="course-card__meta">
          {t('resourceCount', { count: course.resourceIds.length })}
        </span>
      </Card>
    </Link>
  );
}
