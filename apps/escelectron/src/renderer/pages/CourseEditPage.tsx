import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@renderer/components/layout/PageHeader';
import { Button, Input, Spinner, useToast } from '@renderer/components/ui';
import { ResourceStatusBadge } from '@renderer/courses/components/ResourceStatusBadge';
import { useCourse } from '@renderer/courses/hooks/useCourse';
import { useCourses } from '@renderer/courses/hooks/useCourses';
import { ipcCall } from '@renderer/lib/ipc';
import { isLinkResource } from '@shared/resource-types';
import '@renderer/styles/courses.css';

const PRESET_EMOJIS = ['📘', '📗', '📙', '📕', '🧮', '🔬', '💻', '🎨'] as const;

export function CourseEditPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { t } = useTranslation('courses');
  const toast = useToast();
  const navigate = useNavigate();
  const { course, loading, error, refresh } = useCourse(courseId);
  const { update, remove } = useCourses();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string>(PRESET_EMOJIS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (course) {
      setName(course.name);
      setIcon(course.icon ?? PRESET_EMOJIS[0]);
    }
  }, [course]);

  const handleSave = async () => {
    if (!courseId || !name.trim()) {
      return;
    }
    setSaving(true);
    try {
      await update(courseId, { name: name.trim(), icon });
      toast.show(t('saveSuccess'), 'success');
      navigate(`/library/${courseId}`);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : t('saveError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseId || !window.confirm(t('deleteCourseConfirm'))) {
      return;
    }
    try {
      await remove(courseId);
      toast.show(t('deleteCourseSuccess'), 'success');
      navigate('/library');
    } catch (err) {
      toast.show(err instanceof Error ? err.message : t('deleteCourseError'), 'error');
    }
  };

  const handleRemoveResource = async (resourceId: string) => {
    if (!window.confirm(t('deleteResourceConfirm'))) {
      return;
    }
    try {
      await ipcCall((api) => api.resources.remove(resourceId));
      toast.show(t('deleteResourceSuccess'), 'success');
      await refresh();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : t('deleteResourceError'), 'error');
    }
  };

  if (loading) {
    return (
      <div className="page page--course-edit">
        <div className="courses-loading">
          <Spinner />
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="page page--course-edit">
        <p className="courses-error" role="alert">
          {error ?? t('notFound')}
        </p>
        <Link to="/library">
          <Button variant="secondary">{t('backToLibrary')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="page page--course-edit">
      <Link to={`/library/${course.id}`} className="course-detail-header__back">
        {t('backToCourse')}
      </Link>
      <PageHeader title={t('editTitle')} />

      <div className="course-edit-form">
        <Input label={t('nameLabel')} value={name} onChange={(e) => setName(e.target.value)} />
        <fieldset className="course-create-modal__emojis">
          <legend className="course-create-modal__legend">{t('iconLabel')}</legend>
          <div className="course-create-modal__emoji-grid" role="radiogroup" aria-label={t('iconLabel')}>
            {PRESET_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                role="radio"
                aria-checked={icon === emoji}
                className={`course-create-modal__emoji${icon === emoji ? ' course-create-modal__emoji--active' : ''}`}
                onClick={() => setIcon(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="course-edit-form__actions">
          <Button variant="primary" disabled={!name.trim() || saving} onClick={() => void handleSave()}>
            {t('save')}
          </Button>
          <Button variant="danger" onClick={() => void handleDeleteCourse()}>
            {t('deleteCourse')}
          </Button>
        </div>
      </div>

      <h2 className="course-edit-resources__title">{t('resourcesTitle')}</h2>
      <ul className="course-resource-list course-resource-list--edit">
        {course.resources.map((resource) => (
          <li key={resource.id} className="course-resource-list__item">
            <div className="course-resource-list__main">
              <strong>{resource.name}</strong>
              <span className="course-resource-list__kind">{resource.kind}</span>
              {isLinkResource(resource) ? (
                <span className="course-resource-list__path">{resource.url}</span>
              ) : null}
            </div>
            <ResourceStatusBadge status={resource.status} />
            <Button variant="ghost" size="sm" onClick={() => void handleRemoveResource(resource.id)}>
              {t('removeResource')}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
