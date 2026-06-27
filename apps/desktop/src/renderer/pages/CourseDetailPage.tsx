import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '@renderer/components/layout/EmptyState';
import { PageHeader } from '@renderer/components/layout/PageHeader';
import { Button, Spinner, Tabs, useToast } from '@renderer/components/ui';
import type { TabItem } from '@renderer/components/ui';
import { AddLinkModal } from '@renderer/courses/components/AddLinkModal';
import { ResourceStatusBadge } from '@renderer/courses/components/ResourceStatusBadge';
import { useCourse } from '@renderer/courses/hooks/useCourse';
import { LIBRARY_FILE_FILTERS } from '@renderer/library/utils';
import { ipcCall } from '@renderer/lib/ipc';
import { useNotes } from '@renderer/notes/hooks/useNotes';
import { isFileResource, isLinkResource, isNoteResource } from '@shared/resource-types';
import type { Resource } from '@shared/resource-types';
import '@renderer/styles/courses.css';

export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { t } = useTranslation('courses');
  const { t: tp } = useTranslation('pages');
  const toast = useToast();
  const navigate = useNavigate();
  const { course, loading, error, refresh } = useCourse(courseId);
  const { notes, refresh: refreshNotes } = useNotes(
    courseId ? { courseId } : undefined,
  );
  const [activeTab, setActiveTab] = useState('resources');
  const [linkModalOpen, setLinkModalOpen] = useState(false);

  useEffect(() => {
    if (!courseId) {
      return;
    }
    const unsubscribe = window.escopenote.resources.onProgress(() => {
      void refresh();
    });
    return unsubscribe;
  }, [courseId, refresh]);

  const handleAddFiles = async () => {
    if (!courseId) {
      return;
    }
    try {
      const dialog = await ipcCall((api) =>
        api.dialog.openFiles({
          title: t('addFilesDialogTitle'),
          multiple: true,
          filters: LIBRARY_FILE_FILTERS,
        }),
      );
      if (dialog.canceled || dialog.filePaths.length === 0) {
        return;
      }
      await ipcCall((api) => api.resources.addFiles(courseId, dialog.filePaths));
      toast.show(t('addFilesSuccess'), 'success');
      await refresh();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : t('addFilesError'), 'error');
    }
  };

  const handleAddLink = async (url: string) => {
    if (!courseId) {
      return;
    }
    try {
      await ipcCall((api) => api.resources.addLink(courseId, url));
      toast.show(t('addLinkSuccess'), 'success');
      await refresh();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : t('addLinkError'), 'error');
      throw err;
    }
  };

  const handleAddNote = async () => {
    if (!courseId) {
      return;
    }
    try {
      const note = await ipcCall((api) =>
        api.notes.create({ title: t('untitledNote'), courseId }),
      );
      await refreshNotes();
      navigate(`/notes/${note.id}`);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : t('addNoteError'), 'error');
    }
  };

  const resourceLabel = (resource: Resource) => {
    if (isLinkResource(resource)) {
      return resource.url;
    }
    if (isNoteResource(resource)) {
      return resource.name;
    }
    return resource.path;
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

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm(t('deleteNoteConfirm'))) {
      return;
    }
    try {
      await ipcCall((api) => api.notes.delete(noteId));
      toast.show(t('deleteNoteSuccess'), 'success');
      await refreshNotes();
      await refresh();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : t('deleteNoteError'), 'error');
    }
  };

  const resourcesPanel = (
    <div className="course-detail-panel">
      {course && course.resources.length === 0 ? (
        <EmptyState title={t('noResources')} description={t('noResourcesHint')} />
      ) : (
        <ul className="course-resource-list">
          {course?.resources.map((resource) => (
            <li key={resource.id} className="course-resource-list__item">
              <div className="course-resource-list__main">
                <strong>{resource.name}</strong>
                <span className="course-resource-list__kind">{resource.kind}</span>
                <span className="course-resource-list__path">{resourceLabel(resource)}</span>
              </div>
              <ResourceStatusBadge status={resource.status} title={resource.errorMessage} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleRemoveResource(resource.id)}
              >
                {t('removeResource')}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const notesPanel = (
    <div className="course-detail-panel">
      {notes.length === 0 ? (
        <EmptyState title={t('noNotes')} description={t('noNotesHint')} />
      ) : (
        <ul className="course-note-list">
          {notes.map((note) => (
            <li key={note.id} className="course-note-list__item">
              <Link to={`/notes/${note.id}`}>{note.title}</Link>
              <Button variant="ghost" size="sm" onClick={() => void handleDeleteNote(note.id)}>
                {t('deleteNote')}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const tabs: TabItem[] = [
    { id: 'resources', label: t('tabResources'), panel: resourcesPanel },
    { id: 'notes', label: t('tabNotes'), panel: notesPanel },
  ];

  if (loading) {
    return (
      <div className="page page--course-detail">
        <div className="courses-loading">
          <Spinner />
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="page page--course-detail">
        <p className="courses-error" role="alert">
          {error ?? tp('library.notFound')}
        </p>
        <Link to="/library">
          <Button variant="secondary">{t('backToLibrary')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="page page--course-detail">
      <div className="course-detail-header">
        <Link to="/library" className="course-detail-header__back">
          {t('backToLibrary')}
        </Link>
        <div className="course-detail-header__main">
          <span className="course-detail-header__icon" aria-hidden>
            {course.icon ?? '📘'}
          </span>
          <PageHeader title={course.name} />
        </div>
        <div className="course-detail-header__actions">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/library/${course.id}/edit`)}>
            {t('editCourse')}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void handleAddFiles()}>
            {t('addFile')}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setLinkModalOpen(true)}>
            {t('addLink')}
          </Button>
          <Button variant="primary" size="sm" onClick={() => void handleAddNote()}>
            {t('addNote')}
          </Button>
        </div>
      </div>

      <Tabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} ariaLabel={t('courseTabsAria')} />

      <AddLinkModal
        isOpen={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        onAdd={handleAddLink}
      />
    </div>
  );
}
